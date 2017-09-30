from random import SystemRandom


def urandom_shuffle_inplace(xs):
    # Knuth shuffle

    rnd = SystemRandom()

    for i in xrange(len(xs) - 1):
        j = rnd.randint(i, len(xs) - 1)

        xs[i], xs[j] = xs[j], xs[i]


def urandom_shuffled(xs):
    # "Inside-out" Knuth shuffle

    rnd = SystemRandom()

    result = []

    try:
        result.append(next(xs))
    except StopIteration:
        return []

    for i, x in enumerate(xs):
        result.append(x)

        j = rnd.randint(0, i)

        result[i], result[j] = result[j], result[i]

    return result


class Card:
    suits = ('hearts', 'diamonds', 'clubs', 'spades')
    ranks = ('2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A')

    @classmethod
    def all_cards(cls):
        for suit in cls.suits:
            for rank in cls.ranks:
                yield Card(suit, rank)

    @classmethod
    def _get_shuffled_deck(cls):
        return urandom_shuffled(cls.all_cards())

    def __init__(self, suit, rank):
        if suit not in self.suits:
            raise ValueError("Illegal suit `%s`" % suit)

        if rank not in self.ranks:
            raise ValueError("Illegal rank `%s`" % rank)

        self.suit = suit
        self.rank = rank

    @property
    def rank_value(self):
        return self.ranks.index(self.rank)

    def __eq__(self, other):
        return self.suit == other.suit and self.rank == other.rank

    def __hash__(self):
        return self.suits.index(self.suit) * 100 + self.ranks.index(self.rank)

    def __str__(self):
        return repr(self)

    def __repr__(self):
        return "[%s%s]" % (self.suit[0].upper(), self.rank)

    def as_dict(self):
        return {
            'suit': self.suit,
            'rank': self.rank
        }

class GameState:
    def __init__(self, players, player_hands, table_stacks, leftover_deck, played_deck, bottom_card):
        self.phase = 'init'
        self.spotlight = players[0][0]

        self.players = players
        self.player_hands = player_hands

        self.table_stacks = table_stacks

        self.leftover_deck = leftover_deck
        self.played_deck = played_deck

        self.bottom_card = bottom_card

    # Creation

    @classmethod
    def random_state(cls, players):
        deck = Card._get_shuffled_deck()

        bottom_card = deck[0]

        player_hands = {}

        for uid, name in players:
            hand = set(deck.pop() for _ in xrange(6))

            player_hands[uid] = hand

        ordered_players = list(players)
        urandom_shuffle_inplace(ordered_players)

        cls.choose_first_player(bottom_card.suit, ordered_players, player_hands)

        return GameState(ordered_players, player_hands, [], deck, [], bottom_card)

    @staticmethod
    def choose_first_player(trump_suit, players, player_hands):
        # Put the player that should move first at the beginning of the array in accorance to the rules of the game:
        # * choose the player who has the trump card of the lowest rank,
        # * if no one has trump cards, choose a player with who has a card with the lowest rank

        i_start = None

        min_value = 1000

        for i, (uid, name) in enumerate(players):
            for card in player_hands[uid]:
                card_value = (card.suit != trump_suit) * 100 + card.rank_value

                if card_value < min_value:
                    min_value = card_value
                    i_start = i

        players[0], players[i_start] = players[i_start], players[0]

    # Utility

    def index_of_player(self, player_uid):
        for i, (uid, name) in enumerate(self.players):
            if uid == player_uid:
                return i
        else:
            raise ValueError("No player with uid `%s` in the game" % player_uid)

    def relative_index_of_other_player(self, this_player, other_player):
        i_this_player = self.index_of_player(this_player)
        i_other_player = self.index_of_player(other_player)

        return (i_other_player - i_this_player) % len(self.players)

    # Mutation

    def _is_valid_put_move(self, player_uid, card):
        if (self.phase == 'init' and self.spotlight != player_uid) \
                or (self.phase == 'follow' and self.spotlight == player_uid):
            return False

        if not any(uid == player_uid for uid, _ in self.players):
            return False

        if card not in self.player_hands[player_uid]:
            return False

        if len(self.table_stacks) == 0:
            return True

        if self.phase == 'follow' and len(self.table_stacks) == len(self.player_hands[self.spotlight]):
            return False

        if any(c[1] is not None and c[1].rank == card.rank for stack in self.table_stacks for c in stack.iteritems()):
            return True

        return False

    def apply_put_move(self, player_uid, card):
        """
        Apply to the current state an init move (to put the specified card on the table) by the specified player
        :return: List of state deltas to be sent to each player
        """
        if not self._is_valid_put_move(player_uid, card):
            return None

        self.player_hands[player_uid].remove(card)
        self.table_stacks.append({
            'top': card,
            'bottom': None
        })

        deltas = [[{'type': 'STATE DELTA', 'delta': 'PUT ON TABLE', 'card': card.as_dict()}] for p in self.players]

        for i, (uid, name) in enumerate(self.players):
            if player_uid == uid:
                deltas[i].append({
                    'type': 'STATE DELTA',
                    'delta': 'REMOVE FROM PLAYER HAND',
                    'card': card.as_dict()
                })
            else:
                deltas[i].append({
                    'type': 'STATE DELTA',
                    'delta': 'REMOVE FROM OPPONENT HAND',
                    'i_opponent': self.relative_index_of_other_player(uid, player_uid) - 1
                })

        return deltas

    def is_valid_defend_move(self, player_uid, card, i_stack):
        if self.phase != 'follow' or self.spotlight != player_uid:
            return False

        if card not in self.player_hands[player_uid]:
            return False

        top, bottom = self.table_stacks[i_stack]

        if bottom is not None:
            return False

        if card.suit == top.suit and card.rank_value > top.rank_value:
            return True

        if card.suit == self.bottom_card.suit and top.suit != self.bottom_card.suit:
            return True

        return False

    # Representation

    def as_dict_for_player(self, player_uid):
        i_player = self.index_of_player(player_uid)

        shifted_opponents = self.players[i_player + 1:] + self.players[:i_player]

        return {
            'numPlayers': len(self.players),

            'currentPhase': self.phase,
            'currentActor': (self.index_of_player(self.spotlight) - i_player) % len(self.players),
            # TODO: ^^^^^         ^^^^^^^^^
            # TODO: make terminology the same?

            'playerHand': [card.as_dict() for card in self.player_hands[player_uid]],

            'tableStacks': [
                {
                    'top': top.as_dict(),
                    'bottom': bottom.as_dict() if bottom is not None else None
                } for (top, bottom) in self.table_stacks
            ],

            'opponents': [
                {
                    'nickname': name,
                    'numCards': len(self.player_hands[uid])
                } for (uid, name) in shifted_opponents
            ],

            # TODO:  vvvvv                         vvvv
            'leftoverStackSize': len(self.leftover_deck),
            'bottomCard': self.bottom_card.as_dict(),

            'playedStackSize': len(self.played_deck)
            # TODO:^^^^^                       ^^^^
        }


if __name__ == '__main__':
    for c in Card._get_shuffled_deck():
        print c,

    print
