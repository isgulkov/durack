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

from mechanics import GameState, IllegalMoveException

from player_identity import PlayerIdentity


def read_cookie_secret():
    with open('cookie_secret.key') as f:
        return f.read()


class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            (r'/game', GameSocketHandler),

            (r'/', IndexHandler),
            (r'/(.*)', tornado.web.StaticFileHandler, {'path': '../client'}),
        ]

        settings = dict(
            cookie_secret=read_cookie_secret(),
            template_path=os.path.join(os.path.dirname(__file__), "../client")
            # xsrf_cookies=True,
        )

        super(Application, self).__init__(handlers, **settings)


class IndexHandler(tornado.web.RequestHandler):
    def get(self):
        # TODO: integrate with parcel somehow
        self.render("../client/index.html")


class GameSocketHandler(tornado.websocket.WebSocketHandler):
    matchmaking_pool = set()

    running_games = {}

    timers = {}
    timer_deadlines = {}
    paused_timer_delays = {}

    connection_with = {}
    queue_for = {}

    disconnect_timers = {}

    MIN_NUM_PLAYERS = 2 # TODO: Apply some logic to it

    def check_origin(self, origin):
        # TODO: serve client page through Tornado so this can be removed
        return True

    def get_compression_options(self):
        # Non-None enables compression with default options.
        return {}

    def open(self):
        s_uid = self.get_secure_cookie('player-uid')

        identity = None

        if s_uid is not None:
            identity = PlayerIdentity.from_uid(s_uid)

        if identity is None:
            identity = PlayerIdentity.create_random()

            self.set_uid_cookie(identity.uid)

        self.connection_with[identity] = self
        self._identity = identity

        self.send_state_update_to_player(identity, {
            'type': 'CONFIRM SET NICKNAME',
            'newNickname': identity.nickname
        })

        if identity in self.disconnect_timers:
            self.handle_reconnect(identity)

    @staticmethod
    def get_ioloop():
        return tornado.ioloop.IOLoop.current()

    def set_uid_cookie(self, uid):
        self.write_message(json.dumps({
            'type': 'ACCEPT NEW UID',
            'uidCookie': self.create_signed_value('player-uid', uid)
        }))

    @classmethod
    def handle_reconnect(cls, uid):
        cls.get_ioloop().remove_timeout(cls.disconnect_timers[uid])

        del cls.disconnect_timers[uid]

        cls.running_games[uid].handle_reconnect(uid)

    @classmethod
    def handle_disconnect(cls, uid):
        cls.running_games[uid].handle_disconnect(uid)

        del cls.running_games[uid]
        del cls.disconnect_timers[uid]

    def on_close(self):
        identity = self._identity

        del self.connection_with[identity]

        if identity in self.matchmaking_pool:
            self.remove_from_matchmaking_pool(identity)
        elif identity in self.running_games:
            game = self.running_games[identity]

            RECONNECT_TIME = 5

            game.handle_disconnect(identity, RECONNECT_TIME)

            disconnect_timer = self.get_ioloop().call_later(RECONNECT_TIME, lambda: game.handle_leave(identity))

            self.disconnect_timers[identity] = disconnect_timer

    # Matchmaking

    @classmethod
    def update_num_looking_for_game(cls):
        for p in cls.matchmaking_pool:
            cls.send_state_update_to_player(p, {
                'type': 'UPDATE NUM LOOKING FOR GAME',
                'num': len(cls.matchmaking_pool)
            })

    @classmethod
    def remove_from_matchmaking_pool(cls, p):
        if p in cls.matchmaking_pool:
            cls.matchmaking_pool.remove(p)

            cls.update_num_looking_for_game()

    def add_to_matchmaking_pool(self):
        identity = self._identity

        if identity in self.matchmaking_pool:
            return

        if identity in self.running_games:
            return

        self.matchmaking_pool.add(identity)

        self.write_message(json.dumps({
            'type': 'LOOKING FOR GAME'
        }))

        self.update_num_looking_for_game()

        print len(self.matchmaking_pool)
        print self.matchmaking_pool

        if len(self.matchmaking_pool) >= self.MIN_NUM_PLAYERS:
            new_players = []

            while len(new_players) < 6 and len(self.matchmaking_pool) != 0:
                new_players.append(self.matchmaking_pool.pop())

            self.initialize_game(new_players)

    def set_nickname(self, nickname):
        if not (0 < len(nickname) <= 64):
            return

        self._identity.nickname = nickname

        self.write_message(json.dumps({
            'type': 'CONFIRM SET NICKNAME',
            'newNickname': nickname
        }))

    def on_message(self, message):
        msg = json.loads(message)

        if msg['action'] == 'FIND GAME':
            self.add_to_matchmaking_pool()
        elif msg['action'] == 'CANCEL FIND GAME':
            self.remove_from_matchmaking_pool(self._identity)

            self.write_message(json.dumps({
                'type': 'STOPPED LOOKING FOR GAME'
            }))
        elif msg['action'] == 'SET NICKNAME':
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
    def send_state_update_to_player(cls, identity, update):
        # print update, 'to', repr(identity)

        if identity in cls.disconnect_timers:
            # Already disconnected
            return

        connection = cls.connection_with[identity]

        if 'type' not in update:
            update['type'] = 'STATE DELTA'

        try:
            connection.write_message(json.dumps(update))
        except tornado.websocket.WebSocketClosedError:
            cls.handle_disconnect(identity)

    @classmethod
    def initialize_game(cls, identities):
        new_state = GameState.create_random([(p, p.nickname) for p in identities])

        new_state.add_update_handler(lambda p, msg: cls.send_state_update_to_player(p, msg))

        # TODO: refactor into, like, one object
        new_state.update_reset_timer_callback(lambda delay: cls.reset_timer(new_state, delay))
        new_state.update_bump_timer_callback(lambda delay: cls.bump_timer(new_state, delay))
        new_state.update_pause_timer_callback(lambda: cls.pause_timer(new_state))
        new_state.update_resume_timer_callback(lambda: cls.resume_timer(new_state))

        for p in identities:
            cls.running_games[p] = new_state

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


if __name__ == "__main__":
    tornado.options.parse_command_line()
    app = Application()
    app.listen(options.port)

    tornado.ioloop.IOLoop.current().start()
