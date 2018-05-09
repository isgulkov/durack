import logging
import os.path
import json

import tornado.escape
import tornado.ioloop
import tornado.options
import tornado.web
import tornado.websocket

from tornado.options import define, options

define("port", default=8888, help="run on the given port", type=int)
define("client_path", default=None, help="path to the static files of the client app")

from player_state import PlayerState
from game_state import GameState, IllegalMoveException

from player_identity import PlayerIdentity


class GameSocketHandler(tornado.websocket.WebSocketHandler):
    logger = logging.getLogger('durack/server')

    from sys import stdout

    logger.setLevel(logging.DEBUG)

    sh = logging.StreamHandler(stdout)
    sh.setLevel(logging.DEBUG)

    sh.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))

    logger.addHandler(sh)

    matchmaking_pool = set()

    running_games = {}  # TODO: old -- replace with access through `self.player_states`
    player_states = {}  # TODO: type hint this

    timers = {}
    timer_deadlines = {}
    paused_timer_delays = {}

    connection_with = {}
    queue_for = {}

    disconnect_timers = {}

    MIN_NUM_PLAYERS = 2  # TODO: Apply some logic to it

    def check_origin(self, origin):
        # TODO: serve client page through Tornado so this can be removed
        return True

    def get_compression_options(self):
        # Non-None enables compression with default options.
        return {}

    @classmethod
    def add_connection_with(cls, player, connection):
        if player not in cls.connection_with:
            cls.connection_with[player] = set()

        cls.connection_with[player].add(connection)

        print "+", player.nickname, len(cls.connection_with[player]), [str(c) for c in cls.connection_with[player]]

    @classmethod
    def remove_connection_with(cls, player, connection):
        if player not in cls.connection_with:
            return

        if connection not in cls.connection_with[player]:
            return

        cls.connection_with[player].remove(connection)

        print "-", player.nickname, len(cls.connection_with[player]), [str(c) for c in cls.connection_with[player]]

    def set_uid_cookie(self, uid):
        self.write_message(json.dumps({
            'type': 'ACCEPT NEW UID',
            'encryptedUid': self.create_signed_value('player-uid', uid)
        }))

    def open(self):
        s_uid = self.get_secure_cookie('player-uid')

        self.logger.info("Connection from %s" % self)

        player = None

        if s_uid is not None:
            self.logger.debug("New connection, uid cookie is set.")

            player = PlayerIdentity.from_uid(s_uid)

        if player is None:
            self.logger.debug("No uid cookie or unknown one. Will create new identity.")

            player = PlayerIdentity.create_new()

            self.set_uid_cookie(player.uid)

        self.add_connection_with(player, self)

        self._identity = player  # old
        self._player = player  # new

        if player not in self.player_states:
            player_state = PlayerState.get_initial(player)

            self.logger.info("New player online, init their state with %s" % player_state.as_init_action())

            self.player_states[player] = player_state
        elif player in self.disconnect_timers:
            self.player_reconnected(player)
        else:
            self.logger.debug("Got a new connection with %s" % player)

    def on_close(self):
        if not hasattr(self, '_player'):
            self.logger.error("Socket %s doesn't have a player attached to it" % self)
            return

        player = self._player

        if self in self.connection_with[player]:
            self.connection_with[player].remove(self)

            if len(self.connection_with[player]) == 0:
                self.player_disconnected(player)

    @staticmethod
    def get_ioloop():
        return tornado.ioloop.IOLoop.current()

    @classmethod
    def player_reconnected(cls, player):
        cls.get_ioloop().remove_timeout(cls.disconnect_timers[player])

        del cls.disconnect_timers[player]

        state = cls.player_states[player]

        if state.is_looking_for_game():
            cls.add_to_matchmaking_pool(player)
        elif state.is_in_game():
            state.get_game().handle_reconnect(player)

    @classmethod
    def player_disconnected(cls, player):
        if player not in cls.player_states:
            return

        state = cls.player_states[player]

        RECONNECT_TIME = 20  # TODO: make a global constant or a config var

        if state.is_looking_for_game():
            cls.remove_from_matchmaking_pool(player)
        elif state.is_in_game():
            state.get_game().handle_disconnect(player, RECONNECT_TIME)

        cls.disconnect_timers[player] = cls.get_ioloop().call_later(RECONNECT_TIME, cls.player_timed_out, player)

    @classmethod
    def player_timed_out(cls, player):
        cls.logger.info("Player %s has timed out" % player)

        state = cls.player_states[player]

        if state.is_in_game():
            state.get_game().handle_disconnect_timeout(player)

        del cls.player_states[player]

    # Matchmaking

    @classmethod
    def update_num_looking_for_game(cls):
        for player in cls.matchmaking_pool:
            cls.send_msg_to_player(player, {
                'type': 'update-looking-for-game(num)',
                'numLooking': len(cls.matchmaking_pool)
            })

    @classmethod
    def remove_from_matchmaking_pool(cls, player):
        if player in cls.matchmaking_pool:
            cls.matchmaking_pool.remove(player)

            cls.update_num_looking_for_game()

    @classmethod
    def add_to_matchmaking_pool(cls, player):
        cls.logger.info("Will add %s to the matchmaking pool" % player)

        cls.matchmaking_pool.add(player)

        cls.update_num_looking_for_game()

        cls.logger.info("Pool is now of size %d: %s" % (len(cls.matchmaking_pool), cls.matchmaking_pool))

        if len(cls.matchmaking_pool) >= cls.MIN_NUM_PLAYERS:
            new_players = []

            while len(new_players) < 6 and len(cls.matchmaking_pool) != 0:
                new_players.append(cls.matchmaking_pool.pop())

            cls.initialize_game(new_players)

            cls.logger.info("Following %d players matched: %s" % (len(new_players), new_players))

    def set_nickname(self, nickname):
        if not (0 < len(nickname) <= 64):
            return

        self._identity.nickname = nickname

        self.write_message(json.dumps({
            'type': 'CONFIRM SET NICKNAME',
            'newNickname': nickname
        }))

    @classmethod
    def remove_players_from_game(cls, game, players):
        for player in players:
            cls.remove_player_from_game(game, player)

    @classmethod
    def remove_player_from_game(cls, game, player):
        if player not in cls.player_states:
            cls.logger.error("Trying to remove unknown %s from a game" % player)
            return

        state = cls.player_states[player]

        if state.is_in_game() or state.is_after_game():
            if game == state.get_game():
                # TODO: when/if a voluntary leave is implemented, send a signal to the GameState to unsub the player

                cls.player_states[player] = PlayerState.get_initial(player)

                cls.send_msg_to_player(player, cls.player_states[player].as_init_action())

    def on_message(self, msg):
        self.logger.info("Got message %s" % msg)

        msg = json.loads(msg)

        if 'kind' in msg:  # new
            player = self._player

            if msg['kind'] == 'request-init':
                self.logger.info("Got request for init form socket %s" % self)

                self.send_msg_to_player(player, self.player_states[player].as_init_action())
            elif msg['kind'] == 'act-looking-for-game(start)':
                if not self.player_states[player].is_initial():
                    self.logger.warn("Player %s is in %s, should be in initial" % (player, self.player_states[player].as_short_str() ))
                    return

                self.player_states[player] = PlayerState.get_looking_for_game(player, self.matchmaking_pool)

                # TODO: transition from initial to lfg instead of init into lfg!
                self.send_msg_to_player(player, self.player_states[player].as_init_action())

                self.add_to_matchmaking_pool(player)
            elif msg['kind'] == 'act-looking-for-game(stop)':
                if not self.player_states[player].is_looking_for_game():
                    self.logger.warn("Player %s isn't looking for game" % (player,))
                    return

                self.player_states[player] = PlayerState.get_initial(player)

                self.send_msg_to_player(player, self.player_states[player].as_init_action())

                self.remove_from_matchmaking_pool(player)
            elif msg['kind'] == 'act-finish-game':
                if not self.player_states[player].is_after_game():
                    self.logger.warn("Player %s isn't in a game that has ended" % (player,))
                    return

                self.remove_player_from_game(self.player_states[player].get_game(), player)
        elif 'action' in msg:  # old
            if msg['action'] == 'SET NICKNAME':
                self.set_nickname(msg['newNickname'])
            elif msg['action'][:4] == 'MOVE':
                identity = self._identity

                if identity not in self.running_games:
                    logging.warning("Player %s issued a move but doesn't participate in known games")
                    return

                game = self.running_games[identity]

                try:
                    game.process_move(identity, msg)
                except IllegalMoveException as e:
                    logging.warning("Player %s issued an illegal move: %s" % (self, repr(e), ))

                    logging.warning(game.as_dict())

    @classmethod
    def put_in_queue_for(cls, identity, update):
        if identity not in cls.queue_for:
            cls.queue_for[identity] = []

        cls.queue_for[identity].append(update)

        print "Lost messages:"

        for identity, xs in cls.queue_for.iteritems():
            print identity.nickname, ":", len(xs), " "

        print

    @classmethod
    def get_working_connection_with(cls, identity):
        cls.connection_with[identity] = set([conn for conn in cls.connection_with[identity] if conn.stream.socket is not None])

        if len(cls.connection_with[identity]) == 0:
            return None
        else:
            for c in cls.connection_with[identity]:
                return c

    @classmethod
    def send_msg_to_player(cls, player, msg, call_handler_on_disconnect=True):
        cls.logger.debug("Try to send to %s message %s" % (player, msg))

        if player in cls.disconnect_timers or player not in cls.connection_with:
            cls.logger.warn("No connection with for %s" % player)
            # cls.put_in_queue_for(player, msg)
            return

        connection = cls.get_working_connection_with(player)

        if connection is None:
            cls.logger.warn("No good connection for %s" % player)
            return

        if 'type' not in msg:
            msg['type'] = 'STATE DELTA'

        try:
            connection.write_message(msg)
        except tornado.websocket.WebSocketClosedError:
            if call_handler_on_disconnect:
                cls.player_disconnected(player)

    @classmethod
    def handle_game_end(cls, game, players):
        for p in players:
            loser = game.end_summary['loser']

            if loser is not None and p == loser:
                p.count_loss()
            elif p in game.order_disconnected:
                p.count_leave()
            elif p in game.order_won:
                p.count_win()

            if p not in game.order_disconnected:
                cls.player_states[p] = PlayerState.get_after_game(p, game)

                cls.send_msg_to_player(p, cls.player_states[p].as_init_action())

        cls.get_ioloop().call_later(20, lambda: cls.remove_players_from_game(game, players))

    @classmethod
    def initialize_game(cls, players):
        new_state = GameState.create_random([(player, player.nickname) for player in players])

        new_state.add_update_handler(lambda p, msg: cls.send_msg_to_player(p, msg))

        new_state.update_reset_timer_callback(lambda delay: cls.reset_timer(new_state, delay))
        new_state.update_bump_timer_callback(lambda delay: cls.bump_timer(new_state, delay))
        new_state.update_pause_timer_callback(lambda: cls.pause_timer(new_state))
        new_state.update_resume_timer_callback(lambda: cls.resume_timer(new_state))

        new_state.update_end_game_callback(
            lambda identities: cls.handle_game_end(new_state, identities)
        )

        for player in players:
            cls.running_games[player] = new_state

            cls.player_states[player] = PlayerState.get_in_game(player, new_state)

            # cls.send_msg_to_player(player, cls.player_states[player].as_init_action())

        new_state.start()

    @classmethod
    def bump_timer(cls, game, d_delay):
        """
        Reset move timer for `game` to fire `d_delay` seconds further into the future than it would've otherwise
        """

        if game not in cls.timer_deadlines:
            raise ValueError("Attempt to bump non-set timer")

        cls.set_timer(game, cls.timer_deadlines[game] + d_delay)

    @classmethod
    def reset_timer(cls, game, delay):
        """
        Reset move timer for `game` to fire `delay` seconds in the future
        """

        cls.set_timer(game, cls.get_ioloop().time() + delay)

    @classmethod
    def set_timer(cls, game, deadline):
        """
        Reset move timer for `game` to fire at the moment specified by `deadline`
        """

        ioloop = cls.get_ioloop()

        if game in cls.timers:
            ioloop.remove_timeout(cls.timers[game])

        cls.timers[game] = ioloop.call_at(deadline, lambda: game.handle_timer_runout())
        cls.timer_deadlines[game] = deadline

        game.handle_timer_set(deadline - ioloop.time())

    @classmethod
    def pause_timer(cls, game):
        """
        Pause move timer for `game` and save its current delay for further resumption
        """

        if game in cls.paused_timer_delays:
            # Already paused
            return

        if game not in cls.timer_deadlines:
            raise ValueError("Attempt to pause a non-running timer")  # TODO: see if possible

        ioloop = cls.get_ioloop()

        cls.paused_timer_delays[game] = cls.timer_deadlines[game] - ioloop.time()

        ioloop.remove_timeout(cls.timers[game])

    @classmethod
    def resume_timer(cls, game):
        """
        Resume the previously paused move timer for `game` by setting it with a previously saved delay plus a small
        handicap.
        """

        if game not in cls.paused_timer_delays:
            raise ValueError("Attempt to resume a non-paused timer")

        delay = cls.paused_timer_delays[game]

        del cls.paused_timer_delays[game]

        cls.set_timer(game, cls.get_ioloop().time() + delay + 1.5)

    def data_received(self, chunk):
        pass

    def __str__(self):
        socket = self.stream.socket

        if socket is not None:
            return str(self.stream.socket.getpeername())
        else:
            return "(disconnected)"


def get_cookie_secret():
    with open('cookie_secret.key') as f:
        return f.read()


class Application(tornado.web.Application):
    def __init__(self, client_path=None):
        handlers = [
            (r'/durack_game', GameSocketHandler),
        ]

        if client_path is not None:
            handlers.append(
                (r'/(.*)', tornado.web.StaticFileHandler, {
                    'path': client_path,
                    'default_filename': "index.html"
                }),
            )

        super(Application, self).__init__(
            handlers,
            cookie_secret = get_cookie_secret()
        )


def launch_application():
    tornado.options.parse_command_line()

    client_path = options.client_path

    if client_path is not None and options.port != 80:
        # Try to serve static on port 80 anyway

        from socket import error as SocketError

        try:
            client_app = Application((
                (r'/(.*)', tornado.web.StaticFileHandler, {
                    'path': client_path,
                    'default_filename': "index.html"
                }),
            ))

            client_app.listen(80)

            # If successful, don't serve it on the specified port
            client_path = None
        except SocketError as e:
            logging.warn("Failed to listen on port 80 -- will serve static on the websocket server's port instead")

            pass

    app = Application(client_path=client_path)
    app.listen(options.port)

    tornado.ioloop.IOLoop.current().start()
