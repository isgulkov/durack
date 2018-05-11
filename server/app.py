import logging

import tornado.escape
import tornado.ioloop
import tornado.options
import tornado.web
import tornado.websocket

from tornado.options import define, options

define("port", default=8888, help="run on the given port", type=int)

from game_server import DurackGameServer


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
