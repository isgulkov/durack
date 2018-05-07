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

    game_states = {}
    timers = {}
    timer_deadlines = {}

    connection_with = {}
    identity_of = {}
    queue_for = {}

    MIN_NUM_PLAYERS = 2 # TODO: Apply some logic to it

    def get_compression_options(self):
        # Non-None enables compression with default options.
        return {}

    def open(self):
        player_uid = self.get_secure_cookie('player-uid')

        player_identity = None

        if player_uid is not None:
            player_identity = PlayerIdentity.from_uid(player_uid)

        if player_identity is None:
            player_identity = PlayerIdentity.create_random()

            self.set_uid_cookie(player_identity.uid)

        self.register_connection(player_identity, self)

    def set_uid_cookie(self, uid):
        self.write_message(json.dumps({
            'type': 'ACCEPT NEW UID',
            'uidCookie': self.create_signed_value('player-uid', uid)
        }))

    @classmethod
    def register_connection(cls, player_identity, connection):
        cls.connection_with[player_identity] = connection
        cls.identity_of[connection] = player_identity

    @classmethod
    def send_message(cls, player_identity, msg):
        if player_identity in cls.connection_with:
            cls.connection_with[player_identity].write_message(json.dumps(msg))
        else:
            # TODO: just throw exception -- with resync later?
            if player_identity not in cls.queue_for:
                cls.queue_for[player_identity] = []

            cls.queue_for[player_identity].append(msg)

    def check_origin(self, origin):
        # TODO: serve client page through Tornado so this can be removed
        return True

    def on_close(self):
        if self in self.matchmaking_pool:
            self.remove_from_matchmaking_pool(self)

    @classmethod
    def update_num_looking_for_game(cls):
        for p in cls.matchmaking_pool:
            cls.send_message(p, {
                'type': 'UPDATE NUM LOOKING FOR GAME',
                'num': len(cls.matchmaking_pool)
            })

    @classmethod
    def remove_from_matchmaking_pool(cls, p):
        if p in cls.matchmaking_pool:
            cls.matchmaking_pool.remove(p)

            logging.info("%s is no longer looking for game (currently %d total)" % (p, len(cls.matchmaking_pool)))

            cls.update_num_looking_for_game()

    def set_nickname(self, nickname):
        if not (0 < len(nickname) <= 64):
            return

        self.nickname = nickname

        self.write_message(json.dumps({
            'type': 'CONFIRM SET NICKNAME',
            'newNickname': nickname
        }))

    def on_message(self, message):
        msg = json.loads(message)

        logging.info("Got message:")
        logging.info(msg)

        if msg['action'] == 'FIND GAME':
            self.find_game()
        elif msg['action'] == 'CANCEL FIND GAME':
            self.remove_from_matchmaking_pool(self)

            self.write_message(json.dumps({
                'type': 'STOPPED LOOKING FOR GAME'
            }))
        elif msg['action'] == 'SET NICKNAME':
            self.set_nickname(msg['newNickname'])
        elif msg['action'][:4] == 'MOVE':
            if self not in self.game_states:
                logging.warning("Player %s issued a move but doesn't participate in known games")
                return

            game = self.game_states[self]

            try:
                game.process_move(self, msg)
            except IllegalMoveException as e:
                logging.warning("Player %s issued an illegal move: %s" % (self, repr(e), ))

                logging.warning(game.as_dict())

        if self in self.game_states:
            print self.game_states[self].as_dict()

    def find_game(self):
        self.matchmaking_pool.add(self.identity_of[self])

        print self.matchmaking_pool

        self.write_message(json.dumps({
            'type': 'LOOKING FOR GAME'
        }))

        self.update_num_looking_for_game()

        if len(self.matchmaking_pool) >= self.MIN_NUM_PLAYERS:
            new_players = []

            while len(new_players) < 6 and len(self.matchmaking_pool) != 0:
                new_players.append(self.matchmaking_pool.pop())

            self.initialize_game(new_players)

    @classmethod
    def initialize_game(cls, player_identities):
        new_state = GameState.random_state([(p, p.nickname) for p in player_identities])

        def send_state_update(player_identity, update):
            if 'type' not in update:
                update['type'] = 'STATE DELTA'

            try:
                cls.send_message(player_identity, update)
            except tornado.websocket.WebSocketClosedError as e:
                print e  # TODO: handle better
                raise e

        new_state.add_update_handler(send_state_update)

        new_state.update_reset_timer_callback(lambda delay: cls.reset_timer(new_state, delay))
        new_state.update_bump_timer_callback(lambda delay: cls.bump_timer(new_state, delay))

        for p in player_identities:
            cls.game_states[p] = new_state

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

        current_ioloop = tornado.ioloop.IOLoop.current()

        cls.set_timer(game, current_ioloop.time() + delay)

    @classmethod
    def set_timer(cls, game, deadline):
        """
        Reset move timer for `game` to fire at the moment specified by `deadline`
        """

        current_ioloop = tornado.ioloop.IOLoop.current()

        if game in cls.timers:
            current_ioloop.remove_timeout(cls.timers[game])

        cls.timers[game] = current_ioloop.call_at(deadline, lambda: game.handle_timer_runout())
        cls.timer_deadlines[game] = deadline

        game.handle_timer_set(deadline - current_ioloop.time())

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
