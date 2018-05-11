import logging
from time import time

from player_identity import PlayerIdentity
from game_state import GAME_DECK_MODES


class MatchmakingPool(object):
    logger = logging.getLogger('durack/matchmaking')

    def __init__(self, on_match=None, on_update=None):
        self._players = set()

        self._join_time = {}

        self._match_callback = on_match
        self._update_callback = on_update

    def on_match(self, callback):
        self._match_callback = callback

    def on_update(self, callback):
        self._update_callback = callback

    def _match(self, players, **settings):
        self.logger.info("Following %d players matched: %s, on %s" % (len(players), players, settings, ))

        if self._match_callback is not None:
            self._match_callback(players, **settings)

    def _update(self):
        self.logger.info("Pool is now of size %d: %s" % (self.num_looking_for_game, self._players))

        if self._update_callback is not None:
            self._update_callback(self.num_looking_for_game)

    def _pool_sort_key(self, player):
        return (player.mm_min_players, self._join_time[player], )

    def _try_match(self):
        cand_matches = {
            deck: [] for deck in GAME_DECK_MODES
        }

        for player in sorted(self._players, key=self._pool_sort_key):
            player_deck = player.mm_deck

            if player_deck != 'dont-care':
                cand_matches[player_deck].append(player)
            else:
                for cand_match in cand_matches.values():
                    cand_match.append(player)

            for deck, cand_match in cand_matches.iteritems():
                if len(cand_match) == 0:
                    continue

                if cand_match[-1].mm_min_players <= len(cand_match):
                    return {
                        'players': cand_match,
                        'deck': deck
                    }

    @property
    def players(self):
        for player in self._players:
            yield player

    @property
    def num_looking_for_game(self):
        return len(self._players)

    def _add_to_pool(self, player):
        self._players.add(player)
        self._join_time[player] = time()

    def _remove_from_pool(self, player):
        self._players.remove(player)
        del self._join_time[player]

    def add_player(self, player):
        self.logger.debug("Will add %s to the matchmaking pool" % player)

        if player in self._players:
            self.logger.warn("Player %s is already in the matchmaking pool" % player)
            return

        self._add_to_pool(player)

        self._update()

        match = self._try_match()

        if match is not None:
            for player in match['players']:
                self._remove_from_pool(player)

            self._match(match['players'], deck=match['deck'])
            self._update()

    def remove_player(self, player):
        self.logger.debug("Will remove %s to the matchmaking pool" % player)

        if player not in self._players:
            self.logger.warn("Player %s isn't in the matchmaking pool" % player)
        else:
            self._remove_from_pool(player)

            self._update()

