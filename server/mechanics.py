from random import SystemRandom

def urandom_shuffle(xs):
    # Knuth shuffle

    rnd = SystemRandom()

    for i in xrange(len(xs) - 1):
        j = rnd.randint(i, len(xs) - 1)

        xs[i], xs[j] = xs[j], xs[i]

class Card:
    suits = ('hearts', 'diamonds', 'clubs', 'spades')
    ranks = ('A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K')

    @classmethod
    def all_cards(cls):
        for suit in cls.suits:
            for rank in cls.ranks:
                yield Card(suit, rank)

    @classmethod
    def _get_shuffled_deck(cls):
        deck = list(cls.all_cards())

        urandom_shuffle(deck)

        return deck

    def __init__(self, suit, rank):
        if suit not in self.suits:
            raise ValueError("Illegal suit `%s`" % suit)

        if rank not in self.ranks:
            raise ValueError("Illegal rank `%s`" % rank)

        self.suit = suit
        self.rank = rank

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
        self.spotlight = 0

        self.players = players
        self.player_hands = player_hands

        self.table_stacks = table_stacks

        self.leftover_deck = leftover_deck
        self.played_deck = played_deck

        self.bottom_card = bottom_card

    @classmethod
    def random_state(cls, players):
        deck = Card._get_shuffled_deck()

        bottom_card = deck[0]

        player_hands = {}

        for uid, name in players:
            hand = [deck.pop() for _ in xrange(6)]

            player_hands[uid] = hand # TODO: index by position in order?

        ordered_players = list(players)

        urandom_shuffle(ordered_players) # TODO: choose first based on game rules

        return GameState(ordered_players, player_hands, [], deck, [], bottom_card)

    def as_dict_for_player(self, player_uid):
        i_player = None

        for i, (uid, name) in enumerate(self.players):
            if uid == player_uid:
                i_player = i
                break
        else:
            raise ValueError("No player with uid `%s` in the game" % player_uid)

        shifted_opponents = self.players[i_player + 1:] + self.players[:i_player]

        return {
            'numPlayers': len(self.players),

            'currentPhase': self.phase,
            'currentActor': (self.spotlight - i_player) % len(self.players),
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
