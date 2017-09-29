import logging
import os.path
import json

import tornado.escape
import tornado.ioloop
import tornado.options
import tornado.web
import tornado.websocket
import uuid

from tornado.options import define, options

define("port", default=8888, help="run on the given port", type=int)


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
    looking_for_game = set()
    current_games = set()

    def get_compression_options(self):
        # Non-None enables compression with default options.
        return {}

    def open(self):
        logging.info("%s connected", self)

        pass

    def check_origin(self, origin):
        return True # TODO: remove

    def on_close(self):
        if self in GameSocketHandler.looking_for_game:
            if self in GameSocketHandler.looking_for_game:
                GameSocketHandler.looking_for_game.remove(self)

                logging.info("%s is no longer looking for game (currently %d total)"
                             % (self, len(GameSocketHandler.looking_for_game)))

    @classmethod
    def send_periodic_shit(cls):
        logging.info("sending message to %d waiters", len(cls.looking_for_game))

        for waiter in cls.looking_for_game:
            try:
                waiter.write_message({'type': 'COME ON IT'})
            except:
                logging.error("Error sending message", exc_info=True)

    @classmethod
    def initialize_game(self, players):
        dummy_state = {
            'numPlayers': 6,

            'currentPhase': 'init',
            'currentActor': 1,

            'playerHand': [
                {'suit': 'spades', 'value': '10'},
                {'suit': 'hearts', 'value': 'A'},
                {'suit': 'clubs', 'value': 'Q'},
                {'suit': 'clubs', 'value': '7'},
                {'suit': 'hearts', 'value': '8'},
                {'suit': 'diamonds', 'value': '8'},
                {'suit': 'spades', 'value': '10'},
                {'suit': 'hearts', 'value': 'A'},
                {'suit': 'clubs', 'value': 'Q'},
                {'suit': 'clubs', 'value': '7'},
                {'suit': 'hearts', 'value': '8'},
                {'suit': 'diamonds', 'value': '8'},
                {'suit': 'spades', 'value': '10'},
                {'suit': 'hearts', 'value': 'A'},
                {'suit': 'clubs', 'value': 'Q'},
                {'suit': 'clubs', 'value': '7'},
                {'suit': 'hearts', 'value': '8'},
                {'suit': 'diamonds', 'value': '8'}
            ],

            'tableStacks': [
                {
                    'top': {'suit': 'spades', 'value': '10'},
                    'bottom': {'suit': 'hearts', 'value': 'A'}
                },
                {
                    'top': {'suit': 'clubs', 'value': 'Q'},
                    'bottom': {'suit': 'clubs', 'value': '7'}
                },
                {
                    'top': {'suit': 'spades', 'value': '10'},
                    'bottom': {'suit': 'hearts', 'value': 'A'}
                },
                {
                    'top': {'suit': 'clubs', 'value': 'Q'},
                    'bottom': {'suit': 'clubs', 'value': '7'}
                },
                {
                    'top': {'suit': 'spades', 'value': '10'},
                    'bottom': {'suit': 'hearts', 'value': 'A'}
                },
                {
                    'top': {'suit': 'clubs', 'value': 'Q'},
                    'bottom': {'suit': 'clubs', 'value': '7'}
                },
                {
                    'top': {'suit': 'spades', 'value': '10'},
                    'bottom': {'suit': 'hearts', 'value': 'A'}
                },
                {
                    'top': {'suit': 'clubs', 'value': 'Q'},
                    'bottom': {'suit': 'clubs', 'value': '7'}
                },
                {
                    'top': {'suit': 'spades', 'value': '10'},
                    'bottom': {'suit': 'hearts', 'value': 'A'}
                },
                {
                    'top': {'suit': 'clubs', 'value': 'Q'},
                    'bottom': {'suit': 'clubs', 'value': '7'}
                },
                {
                    'top': {'suit': 'hearts', 'value': '8'}
                },
                {
                    'top': {'suit': 'diamonds', 'value': '8'}
                }
            ],

            'opponents': [
                {'nickname': 'pidor', 'numCards': 2},
                {'nickname': 'Grigory Kozinov otsosal huev korzinu', 'numCards': 25},
                {'nickname': '|||/||//||///111', 'numCards': 15},
                {'nickname': '1ll1l1ll1l1lll11', 'numCards': 10},
                {'nickname': 'o priv', 'numCards': 18}
            ],

            'leftoverStackSize': 2,
            'bottomCard': {'suit': 'hearts', 'value': 'A'},

            'playedStackSize': 10
        }

        for p in players:
            p.write_message(json.dumps({
                'type': 'INITIALIZE GAME',
                'init_state': dummy_state
            }))

    def on_message(self, message):
        msg = json.loads(message)

        if msg['action'] == 'FIND GAME':
            GameSocketHandler.looking_for_game.add(self)

            self.write_message(json.dumps({
                'type': 'LOOKING FOR GAME'
            }))

            logging.info("%s looking for game (currently %d total)" % (self, len(GameSocketHandler.looking_for_game)))

            # TODO: differentiate by number of players
            if len(GameSocketHandler.looking_for_game) >= 2:
                new_players = []

                for i in xrange(2):
                    new_players.append(GameSocketHandler.looking_for_game.pop())

                GameSocketHandler.initialize_game(new_players)

    def data_received(self, chunk):
        pass

    def __str__(self):
        return str(self.stream.socket.getpeername())


if __name__ == "__main__":
    tornado.options.parse_command_line()
    app = Application()
    app.listen(options.port)

    tornado.ioloop.IOLoop.current().start()
