
import logging


class PlayerState:
    """
    Represents the state of a particular player with respect to the game UI.
    """

    Initial, LookingForGame, InGame, AfterGame = range(4)

    def __init__(self, player, root, **kwargs):
        self.player = player
        self.root = root
        self.vars = kwargs

        self._update_handlers = set()

    def add_update_handler(self, handler):
        self._update_handlers.add(handler)

        return lambda: self._update_handlers.remove(handler)

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

    @classmethod
    def get_after_game(cls, player, game_state):
        return PlayerState(player, cls.AfterGame, game=game_state)

    def is_initial(self):
        return self.root == self.Initial

    def is_looking_for_game(self):
        return self.root == self.LookingForGame

    def is_in_game(self):
        return self.root == self.InGame

    def is_after_game(self):
        return self.root == self.AfterGame

    def get_game(self):
        if not (self.is_in_game() or self.is_after_game()):
            raise ValueError()

        return self.vars['game']

    @classmethod
    def get_root_str(cls, root):
        if root == cls.Initial:
            return 'initial'
        elif root == cls.LookingForGame:
            return 'looking-for-game'
        elif root == cls.InGame:
            return 'in-game'
        elif root == cls.AfterGame:
            return 'after-game'
        else:
            raise ValueError()

    def as_short_str(self):
        return "<PlayerState %s>" % self.get_root_str(self.root)

    def as_init_action(self):
        if self.root == self.Initial:
            action = {
                'type': 'init-player(initial)'
            }
        elif self.root == self.LookingForGame:
            action = {
                'type': 'init-player(looking-for-game)',
                'numLooking': self.vars['pool'].num_looking_for_game
            }
        elif self.root == self.InGame:
            action = {
                'type': 'init-player(in-game)',
                'game': self.vars['game'].as_dict_for_player(self.player)
            }
        elif self.root == self.AfterGame:
            action = {
                'type': 'init-player(after-game)',
                'summary': self.vars['game'].get_broader_end_summary(self.player),
                'game': self.vars['game'].as_dict_for_player(self.player)
            }
        else:
            raise ValueError()

        action.update({
            'nickname': self.player.nickname
        })

        return action
