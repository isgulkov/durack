import logging
import tornado.escape
import tornado.ioloop
import tornado.options
import tornado.web
import tornado.websocket
import os.path
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
            cookie_secret="__TODO:_GENERATE_YOUR_OWN_RANDOM_VALUE_HERE__",
            template_path=os.path.join(os.path.dirname(__file__), "../client"),
            static_path=os.path.join(os.path.dirname(__file__), "../client"),
            xsrf_cookies=True,
        )

        super(Application, self).__init__(handlers, **settings)


class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("index.html", messages=GameSocketHandler.cache)

    def data_received(self, chunk):
        pass


class GameSocketHandler(tornado.websocket.WebSocketHandler):
    waiters = set()
    cache = []
    cache_size = 200

    def get_compression_options(self):
        # Non-None enables compression with default options.
        return {}

    def open(self):
        logging.info("%s logged on", self)

        GameSocketHandler.waiters.add(self)

    def check_origin(self, origin):
        return True

    def on_close(self):
        GameSocketHandler.waiters.remove(self)

    @classmethod
    def send_periodic_shit(cls):
        if len(cls.waiters) != 0:
            logging.info("sending message to %d waiters", len(cls.waiters))

        for waiter in cls.waiters:
            try:
                waiter.write_message({'type': 'COME ON IT'})
            except:
                logging.error("Error sending message", exc_info=True)

    def on_message(self, message):
        pass

    def data_received(self, chunk):
        pass


if __name__ == "__main__":
    tornado.options.parse_command_line()
    app = Application()
    app.listen(options.port)

    tornado.ioloop.PeriodicCallback(GameSocketHandler.send_periodic_shit, 100).start()
    tornado.ioloop.IOLoop.current().start()
