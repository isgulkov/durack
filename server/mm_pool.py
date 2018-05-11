import logging

class MatchmakingPool(object):
    logger = logging.getLogger('durack/matchmaking')

    MIN_NUM_PLAYERS = 2  # TODO: Apply some logic to it

    def __init__(self, on_match=None, on_update=None):
        # TODO: 1-to-1 with game server

        self.players = set()

        self._match_callback = on_match
        self._update_callback = on_update

    def on_match(self, callback):
        self._match_callback = callback

    def on_update(self, callback):
        self._update_callback = callback

    def _match(self, players):
        self.logger.info("Following %d players matched: %s" % (len(players), players))

        if self._match_callback is not None:
            self._match_callback(players)

    def _update(self):
        self.logger.info("Pool is now of size %d: %s" % (self.num_looking_for_game, self.players))

        if self._update_callback is not None:
            self._update_callback(self.num_looking_for_game)

    @property
    def num_looking_for_game(self):
        return len(self.players)

    def add_player(self, player):
        self.logger.debug("Will add %s to the matchmaking pool" % player)

        if player in self.players:
            self.logger.warn("Player %s is already in the matchmaking pool" % player)

        self.players.add(player)

        self._update()

        if len(self.players) >= self.MIN_NUM_PLAYERS:
            new_players = []

            while len(new_players) < 6 and len(self.players) != 0:
                new_players.append(self.players.pop())

            self._match(new_players)
            self._update()

    def remove_player(self, player):
        self.logger.debug("Will remove %s to the matchmaking pool" % player)

        if player not in self.players:
            self.logger.warn("Player %s isn't in the matchmaking pool" % player)
        else:
            self.players.remove(player)

            self._update()

