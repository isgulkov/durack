
from tornado.ioloop import IOLoop


class Timer:
    """
    A timer for use as a move timer in a game or the like

    Has the following states:

    - Unset -- not currently running;
    - Running(t) -- running to fire at the point in time `t`;
    - Paused(d) -- paused to be layer resumed with delay `d`.

    The values of the internal variables should be the following in each of the states:

    ================= ================= =================
    State             self._deadline    self._saved_delay
    ================= ================= =================
    Unset                        `None`            `None`
    Running(t)                      `t`            `None`
    Paused(d)                    `None`               `d`
    ================= ================= =================

    `self._timeout` when entering the "Running(t)" state is assigned a tornado timeout object that is to be "cleared"
    each time timer leaves the "Running(t)" state.

    """

    def __init__(self, on_fire=None, on_reset=None):
        self._deadline = None
        self._saved_delay = None

        self._fire_callback = on_fire
        self._reset_callback = on_reset

    def on_fire(self, callback):
        self._fire_callback = callback

    def on_reset(self, callback):
        self._reset_callback = callback

    def _handle_timeout(self):
        if self._fire_callback is not None:
            self._fire_callback()

        self._deadline = None

    def _handle_reset(self, delay):
        if self._reset_callback is not None:
            self._reset_callback(delay)

    @property
    def ioloop(self):
        return IOLoop.current()

    def _reset_at(self, deadline):
        """
        any -> Running(time() + `deadline`)
        """

        if self._deadline is not None:
            self.ioloop.remove_timeout(self._timeout)
        elif self._saved_delay is not None:
            self._saved_delay = None

        self._deadline = deadline

        self._timeout = self.ioloop.call_at(deadline, self._fire_callback)

        self._reset_callback(self.delay)

    def reset(self, delay):
        """
        any -> Running(time() + `delay`)
        """

        self._reset_at(self.ioloop.time() + delay)

    def bump(self, delay):
        """
        Running(t) -> Running(t + `delay`)
        """
        if self._deadline is not None:
            self._reset_at(self._deadline + delay)
        else:
            raise ValueError(
                "Can't bump a %s timer" % ('Paused' if self._saved_delay else 'Unset')
            )

    @property
    def delay(self):
        """
        Return the current delay `t` - time() if in state Running(t), `None` otherwise.
        """

        try:
            return self._deadline - self.ioloop.time()
        except TypeError:
            return None

    def pause(self):
        """
        Running(t) -> Paused(t - time())
        """

        if self._saved_delay is not None:
            raise ValueError("Can't pause an already Paused timer")
        elif self._deadline is None:
            raise ValueError("Can't pause an Unset timer")

        self._saved_delay = self._deadline - self.ioloop.time()

        self.ioloop.remove_timeout(self._timeout)
        self._deadline = None

    def resume(self):
        """
        Paused(d) -> Running(time() + d)
        """

        if self._saved_delay is None:
            raise ValueError("Can't resume an Unset timer")
        elif self._deadline is not None:
            raise ValueError("Can't resume an already Running timer")

        self.reset(self._saved_delay)
