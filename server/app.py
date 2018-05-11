import logging
import json

import tornado.escape
import tornado.ioloop
import tornado.options
import tornado.web
import tornado.websocket

from tornado.options import define, options

define("port", default=8888, help="run on the given port", type=int)

from mm_pool import MatchmakingPool

from player_state import PlayerState
from game_state import GameState, IllegalMoveException

from player_identity import PlayerIdentity


class DurackGameServer:
    logger = logging.getLogger('durack/server')

    def __init__(self):
        self.running_games = {}  # TODO: old -- remove when unnecessary
        self.player_states = {}  # TODO: type hint this

        self.identity_of = {}
        self.connections_with = {}
        self.queue_for = {}  # TODO: remove?

        self.disconnect_timeouts = {}

        self.mm_pool = MatchmakingPool(on_update=self._update_num_looking_for_game, on_match=self._initialize_game)

    @staticmethod
    def get_ioloop():
        return tornado.ioloop.IOLoop.current()

    # Matchmaking pool

    def _update_num_looking_for_game(self, num_looking_for_game):
        for player in self.mm_pool.players:
            self._send_to_player(player, {
                'type': 'update-looking-for-game(num)',
                'numLooking': num_looking_for_game
            })

    def _initialize_game(self, players):
        new_state = GameState.create_random([(player, player.nickname) for player in players])

        # TODO: make a separate method "send state delta" so that game only deals in state deltas, not full actions
        new_state.add_update_handler(lambda p, msg: self._send_to_player(p, msg))

        new_state.update_end_game_callback(
            lambda players: self._handle_game_end(new_state, players)
        )

        for player in players:
            self.running_games[player] = new_state  # TODO: old -- remove when unnecessary

            self.player_states[player] = PlayerState.get_in_game(player, new_state)

            self._send_to_player(player, self.player_states[player].as_init_action())

        new_state.start()

    # Identity

    def _identify_player(self, connection):
        s_uid = connection.get_secure_cookie('player-uid')

        self.logger.info("Connection from %s" % self)

        player = None

        if s_uid is not None:
            self.logger.debug("New connection, uid cookie is set.")

            player = PlayerIdentity.from_uid(s_uid)

        if player is None:
            self.logger.debug("No uid cookie or unknown one. Will create new identity.")

            player = PlayerIdentity.create_new()

            self._set_uid_cookie(connection, player.uid)

        return player

    def _set_uid_cookie(self, connection, uid):
        connection.write_message({
            'type': 'ACCEPT NEW UID',
            'encryptedUid': connection.create_signed_value('player-uid', uid)
        })

    def _set_nickname(self, player, new_nickname):
        if 0 < len(new_nickname) <= 64 and '<' not in new_nickname:  # TODO: better filtering
            player.nickname = new_nickname

        self._send_to_player(player, {
            'type': 'CONFIRM SET NICKNAME',
            'newNickname': player.nickname
        })

    # Player communication

    def _send_to_player(self, player, msg, call_handler_on_disconnect=True):
        self.logger.debug("Try to send to %s message %s" % (player, msg))

        if player in self.disconnect_timeouts or player not in self.connections_with:
            self.logger.warn("No connection with for %s" % player)
            # cls.put_in_queue_for(player, msg)
            return

        connection = self._get_working_connection_with(player)

        if connection is None:
            self.logger.warn("No good connection for %s" % player)
            return

        if 'type' not in msg:
            msg['type'] = 'STATE DELTA'

        try:
            connection.write_message(msg)
        except tornado.websocket.WebSocketClosedError:
            if call_handler_on_disconnect:
                # TODO: distinguish disconnect from failure of one of the sockets?
                self._player_disconnected(player)

    def handle_message(self, connection, msg):
        self.logger.info("Got message %s" % msg)

        msg = json.loads(msg)

        if 'kind' in msg:  # new
            player = self.identity_of[connection]

            if msg['kind'] == 'request-init':
                self.logger.info("Got request for init form socket %s" % self)

                self._send_to_player(player, self.player_states[player].as_init_action())
            elif msg['kind'] == 'act-looking-for-game(start)':
                if not self.player_states[player].is_initial():
                    self.logger.warn("Player %s is in %s, should be in initial" % (
                    player, self.player_states[player].as_short_str()))
                    return

                self.player_states[player] = PlayerState.get_looking_for_game(player, self.mm_pool)

                # TODO: transition from initial to lfg instead of init into lfg!
                self._send_to_player(player, self.player_states[player].as_init_action())

                self.mm_pool.add_player(player)
            elif msg['kind'] == 'act-looking-for-game(stop)':
                if not self.player_states[player].is_looking_for_game():
                    self.logger.warn("Player %s isn't looking for game" % (player,))
                    return

                self.player_states[player] = PlayerState.get_initial(player)

                self._send_to_player(player, self.player_states[player].as_init_action())

                self.mm_pool.remove_player(player)
            elif msg['kind'] == 'act-finish-game':
                if not self.player_states[player].is_after_game():
                    self.logger.warn("Player %s isn't in a game that has ended" % (player,))
                    return

                self._remove_player_from_game(self.player_states[player].get_game(), player)
        elif 'action' in msg:  # old
            identity = self.identity_of[connection]

            if msg['action'] == 'SET NICKNAME':
                self._set_nickname(identity, msg['newNickname'])
            elif msg['action'][:4] == 'MOVE':
                if identity not in self.running_games:
                    logging.warning("Player %s issued a move but doesn't participate in known games")
                    return

                game = self.running_games[identity]

                try:
                    game.process_move(identity, msg)
                except IllegalMoveException as e:
                    logging.warning("Player %s issued an illegal move: %s" % (self, repr(e),))

                    logging.warning(game.as_dict())

    # Connection management

    def _add_connection_with(self, player, connection):
        if player not in self.connections_with:
            self.connections_with[player] = set()

        self.connections_with[player].add(connection)

        print "+", player.nickname, len(self.connections_with[player]), [str(c) for c in self.connections_with[player]]

    def _remove_connection_with(self, player, connection):
        if player not in self.connections_with:
            return

        if connection not in self.connections_with[player]:
            return

        self.connections_with[player].remove(connection)

        print "-", player.nickname, len(self.connections_with[player]), [str(c) for c in self.connections_with[player]]

    def _get_working_connection_with(self, player):
        self.connections_with[player] = set(
            [conn for conn in self.connections_with[player] if conn.stream.socket is not None]
        )

        for connection in self.connections_with[player]:
            return connection
        else:
            return None

    def handle_open(self, connection):
        player = self._identify_player(connection)

        self._add_connection_with(player, connection)

        self.identity_of[connection] = player

        if player not in self.player_states:
            player_state = PlayerState.get_initial(player)

            self.logger.info("New player online, init their state with %s" % player_state.as_init_action())

            self.player_states[player] = player_state
        elif player in self.disconnect_timeouts:
            self._player_reconnected(player)
        else:
            self.logger.debug("Got a new connection with %s" % player)

    def handle_close(self, connection):
        if connection not in self.identity_of:
            self.logger.warn("Socket %s closed before having a player attached to it" % self)
            return

        player = self.identity_of[connection]

        if connection in self.connections_with[player]:
            self.connections_with[player].remove(connection)

            if len(self.connections_with[player]) == 0:
                self._player_disconnected(player)

    # Player connection status

    def _player_disconnected(self, player):
        if player not in self.player_states:
            return

        state = self.player_states[player]

        RECONNECT_TIME = 20  # TODO: make a global constant or a config var

        if state.is_looking_for_game():
            self.mm_pool.remove_player(player)
        elif state.is_in_game():
            state.get_game().handle_disconnect(player, RECONNECT_TIME)

        self.disconnect_timeouts[player] = self.get_ioloop().call_later(RECONNECT_TIME, self._player_timed_out, player)

    def _player_reconnected(self, player):
        self.get_ioloop().remove_timeout(self.disconnect_timeouts[player])

        del self.disconnect_timeouts[player]

        state = self.player_states[player]

        if state.is_looking_for_game():
            self.mm_pool.add_player(player)
        elif state.is_in_game():
            state.get_game().handle_reconnect(player)

    def _player_timed_out(self, player):
        self.logger.info("Player %s has timed out" % player)

        state = self.player_states[player]

        if state.is_in_game():
            state.get_game().handle_disconnect_timeout(player)

        del self.player_states[player]

    # Player-game relationship

    def _remove_players_from_game(self, game, players):
        for player in players:
            self._remove_player_from_game(game, player)

    def _remove_player_from_game(self, game, player):
        if player not in self.player_states:
            self.logger.error("Trying to remove unknown %s from a game" % player)
            return

        state = self.player_states[player]

        if state.is_in_game() or state.is_after_game():
            if game == state.get_game():
                # TODO: when/if a voluntary leave is implemented, send a signal to the GameState to unsub the player

                self.player_states[player] = PlayerState.get_initial(player)

                self._send_to_player(player, self.player_states[player].as_init_action())

    def _handle_game_end(self, game, players):
        for player in game.order_disconnected:
            player.count_leave()

        for player in game.order_won:
            player.count_win()

        loser = game.end_summary['loser']

        if loser is not None:
            loser.count_loss()

        for p in players:
            if p not in game.order_disconnected:
                self.player_states[p] = PlayerState.get_after_game(p, game)

                self._send_to_player(p, self.player_states[p].as_init_action())

        self.get_ioloop().call_later(20, lambda: self._remove_players_from_game(game, players))


class GameSocketHandler(tornado.websocket.WebSocketHandler):
    logger = logging.getLogger('durack/server')

    server = DurackGameServer()

    def check_origin(self, origin):
        # TODO: serve client page through Tornado so this can be removed
        return True

    def get_compression_options(self):
        # Non-None enables compression with default options.
        return {}

    def open(self):
        self.server.handle_open(self)

    def on_close(self):
        self.server.handle_close(self)

    def on_message(self, msg):
        self.server.handle_message(self, msg)

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


def launch_application():
    tornado.options.parse_command_line()

    app = tornado.web.Application([
            (r'/durack_game', GameSocketHandler),
        ], cookie_secret = get_cookie_secret())
    app.listen(options.port)

    tornado.ioloop.IOLoop.current().start()
