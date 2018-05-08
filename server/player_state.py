
import logging


class PlayerState:
    """
    Represents the state of a particular player with respect to the game UI.
    """

    Initial, LookingForGame, InGame = range(3)

    def __init__(self, player, root, **kwargs):
        self.player = player
        self.root = root
        self.vars = kwargs

    @classmethod
    def get_initial(cls, player):
        # TODO: is player needed here?

        return PlayerState(player, cls.Initial)

    @classmethod
    def get_looking_for_game(cls, player, matchmaking_pool):
        return PlayerState(player, cls.LookingForGame, pool=matchmaking_pool)

    @classmethod
    def get_in_game(cls, player, game_state):
        return PlayerState(player, cls.InGame, game=game_state)

    def as_init_action(self):
        if self.root == self.Initial:
            action = {
                'type': 'init-player(initial)'
            }
        elif self.root == self.LookingForGame:
            action = {
                'type': 'init-player(looking-for-game)'
            }
        elif self.root == self.InGame:
            action = {
                'type': 'init-player(in-game)'
            }
        else:
            raise ValueError()

        action.update({
            'nickname': self.player.nickname
        })

        return action
