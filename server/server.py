from itertools import izip
import logging
import os.path
import json
import uuid

import tornado.escape
import tornado.ioloop
import tornado.options
import tornado.web
import tornado.websocket

from tornado.options import define, options

define("port", default=8888, help="run on the given port", type=int)

from mechanics import Card, GameState, GameStateDelta


class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            (r'/', MainHandler),
            (r'/game', GameSocketHandler),
        ]

        settings = dict(
            # cookie_secret="__TODO:_GENERATE_YOUR_OWN_RANDOM_VALUE_HERE__",
            template_path=os.path.join(os.path.dirname(__file__), "../client"),
            static_path=os.path.join(os.path.dirname(__file__), "../client"),
            # xsrf_cookies=True,
        )

        super(Application, self).__init__(handlers, **settings)


class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("index.html")

    def data_received(self, chunk):
        pass


class GameSocketHandler(tornado.websocket.WebSocketHandler):
    matchmaking_pool = set()

    game_states = {}

    MIN_NUM_PLAYERS = 2 # TODO: Apply some logic to it

    def get_compression_options(self):
        # Non-None enables compression with default options.
        return {}

    def open(self):
        logging.info("%s connected", self)

        # TODO: make games persistent between connections (uuid cookie, initialize)

        pass

    def check_origin(self, origin):
        # TODO: serve client page through Tornado so this can be removed
        return True

    def on_close(self):
        if self in self.matchmaking_pool:
            self.remove_from_matchmaking_pool(self)

    @classmethod
    def initialize_game(self, player_connections):
        new_state = GameState.random_state([(p, "pidor") for p in player_connections])

        for p in player_connections:
            self.game_states[p] = new_state

        for connection, name in new_state.players:
            connection.write_message(json.dumps({
                'type': 'INITIALIZE GAME',
                'init_state': new_state.as_dict_for_player(connection)
            }))

    @classmethod
    def update_num_looking_for_game(cls):
        for p in cls.matchmaking_pool:
            p.write_message(json.dumps({
                'type': 'UPDATE NUM LOOKING FOR GAME',
                'num': len(cls.matchmaking_pool)
            }))

    @classmethod
    def remove_from_matchmaking_pool(cls, p):
        if p in cls.matchmaking_pool:
            cls.matchmaking_pool.remove(p)

            logging.info("%s is no longer looking for game (currently %d total)"
                         % (p, len(cls.matchmaking_pool)))

            cls.update_num_looking_for_game()

    def on_message(self, message):
        msg = json.loads(message)

        if msg['action'] == 'FIND GAME':
            self.find_game()
        elif msg['action'] == 'CANCEL FIND GAME':
            self.remove_from_matchmaking_pool(self)

            self.write_message(json.dumps({
                'type': 'STOPPED LOOKING FOR GAME'
            }))
        elif msg['action'] == 'MOVE PUT':
            self.process_put_move(Card(**msg['card']))

    def process_put_move(self, card):
        if self not in self.game_states:
            # TODO: show error message on the client
            logging.warning("Player %s issued a move but doesn't participate in known games")
            return

        game_state = self.game_states[self]

        delta_messages = game_state.apply_put_move(self, card)

        if delta_messages is None:
            logging.warning("Player %s issued an invalid move")
            return

        for (connection, name), deltas in izip(game_state.players, delta_messages):
            for d in deltas:
                connection.write_message(d)

    @classmethod
    def send_deltas(cls, game, delta):
        for p in (uid for uid, name in game.players):
            pass

    def find_game(self):
        self.matchmaking_pool.add(self)

        self.write_message(json.dumps({
            'type': 'LOOKING FOR GAME'
        }))

        logging.info("%s looking for game (currently %d total)" % (self, len(self.matchmaking_pool)))

        self.update_num_looking_for_game()

        if len(self.matchmaking_pool) >= self.MIN_NUM_PLAYERS:
            new_players = []

            while len(new_players) < 6 and len(self.matchmaking_pool) != 0:
                new_players.append(self.matchmaking_pool.pop())

                self.initialize_game(new_players)

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
