from random import SystemRandom
import logging


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


class IllegalMoveException(ValueError):
    pass


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

        self._update_handlers = set()

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

        cls._choose_first_player(bottom_card.suit, ordered_players, player_hands)

        return GameState(ordered_players, player_hands, [], deck, [], bottom_card)

    @staticmethod
    def _choose_first_player(trump_suit, players, player_hands):
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

    def _index_of_player(self, player_uid):
        # TODO; do something about all these indices (put in hash table ?)
        for i, (uid, name) in enumerate(self.players):
            if uid == player_uid:
                return i
        else:
            raise ValueError("No player with uid `%s` in the game" % player_uid)

    def _relative_index_of_other_player(self, this_player, other_player):
        i_this_player = self._index_of_player(this_player)
        i_other_player = self._index_of_player(other_player)

        return (i_other_player - i_this_player) % len(self.players)

    # Mutation

    def process_move(self, player_uid, move):
        if move['action'] == 'MOVE PUT':
            if not self._apply_put_move(player_uid, Card(**move['card'])):
                raise IllegalMoveException("Illegal put move") # TODO: add details
        elif move['action'] == 'MOVE END INIT':
            if self.phase == 'init' and self.spotlight == player_uid and len(self.table_stacks) != 0:
                self._end_init_phase()
        elif move['action'] == 'MOVE DEFEND':
            if not self._apply_defend_move(player_uid, Card(**move['card']), move['i_stack']):
                raise IllegalMoveException("Illegal defend move") # TODO: add details
        elif move['action'] == 'MOVE TAKE':
            if not self._apply_take_move(player_uid):
                raise IllegalMoveException("Illegal take move") # TODO: add details
        else:
            raise ValueError("Unknown type of move `%s`" % move['action'])

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

        num_empty_stacks = len([stack for stack in self.table_stacks if stack['bottom'] is None])

        if num_empty_stacks == len(self.player_hands[self.spotlight]):
            return False

        if any(c[1] is not None and c[1].rank == card.rank for stack in self.table_stacks for c in stack.iteritems()):
            return True

        return False

    def _apply_put_move(self, player_uid, card):
        """
        Apply to the current state an init move (to put the specified card on the table) by the specified player
        :return: List of state deltas to be sent to each player
        """
        if not self._is_valid_put_move(player_uid, card):
            return False

        self.player_hands[player_uid].remove(card)
        self.table_stacks.append({
            'top': card,
            'bottom': None
        })

        for uid, name in self.players:
            self._send_update(uid, {
                'change': 'PUT ON TABLE',
                'card': card.as_dict()
            })

        self._send_remove_from_hand(player_uid, card)

        if not self._put_possible(player_uid):
            self._end_init_phase()

        return True

    def _put_possible(self, player_uid):
        # TODO: refactor this check

        for card in self.player_hands[player_uid]:
            if self._is_valid_put_move(player_uid, card):
                return True

        return False

    def _end_init_phase(self):
        if self.phase != 'init':
            raise IllegalMoveException("Not in init phase")

        self._advance_spotlight()

        self.phase = 'follow'

        for uid, name in self.players:
            self._send_update(uid, {
                'change': 'PHASE',
                'phase': 'follow'
            })

    def _advance_spotlight(self):
        i_new_spotlight = (self._index_of_player(self.spotlight) + 1) % len(self.players)

        self.spotlight = self.players[i_new_spotlight][0]

        for uid, name in self.players:
            self._send_update(uid, {
                'change': 'SPOTLIGHT',
                'i_spotlight': self._relative_index_of_other_player(uid, self.spotlight)
            })

    def _is_valid_defend_move(self, player_uid, card, i_stack):
        if self.phase != 'follow' or self.spotlight != player_uid:
            return False

        if card not in self.player_hands[player_uid]:
            return False

        if not (0 <= i_stack < len(self.table_stacks)):
            return False

        top = self.table_stacks[i_stack]['top']
        bottom = self.table_stacks[i_stack]['bottom']

        if bottom is not None:
            return False

        if card.suit == top.suit and card.rank_value > top.rank_value:
            return True

        if card.suit == self.bottom_card.suit and top.suit != self.bottom_card.suit:
            return True

        return False

    def _apply_defend_move(self, player_uid, card, i_stack):
        if not self._is_valid_defend_move(player_uid, card, i_stack):
            return False

        self.table_stacks[i_stack]['bottom'] = card

        self.player_hands[player_uid].remove(card)
        self._send_remove_from_hand(player_uid, card)

        for uid, name in self.players:
            self._send_update(uid, {
                'change': 'PUT ONTO STACK',
                'i_stack': i_stack,
                'card': card.as_dict()
            })

        if self._follow_phase_ended():
            self._end_follow_phase()

        return True

    def _follow_phase_ended(self):
        if any(stack['bottom'] is None for stack in self.table_stacks):
            return False

        for uid, name in self.players:
            if uid == self.spotlight:
                continue

            for card in self.player_hands[uid]:
                for table_card in self._get_table_cards():
                    if card.rank == table_card.rank:
                        return False

        return True

    def _hand_out_cards(self):
        i_spotlight = self._index_of_player(self.spotlight)

        players = self.players[i_spotlight:] + self.players[:i_spotlight]

        additional_cards = [[] for _ in players]

        go = True

        while go:
            go = False
            for i, (uid, name) in enumerate(players):
                if len(self.player_hands[uid]) + len(additional_cards[i]) < 6 and len(self.leftover_deck) != 0:
                    card = self.leftover_deck.pop()

                    additional_cards[i].append(card)
                    go = True

        for i, (uid, name) in enumerate(players):
            # TODO: do these two things in one method?

            self.player_hands[uid].update(additional_cards[i])
            self._send_add_to_player_hand(uid, additional_cards[i])

        self._send_remove_from_deck(len(additional_cards))

    def _get_table_cards(self):
        for stack in self.table_stacks:
            yield stack['top']

            if stack['bottom'] is not None:
                yield stack['bottom']

    def _is_valid_take_move(self, player_uid):
        if self.phase != 'follow' or self.spotlight != player_uid:
            return False

        if len(self.table_stacks) == 0:
            return False

        return True

    def _apply_take_move(self, player_uid):
        if not self._is_valid_take_move(player_uid):
            return False

        table_cards = list(self._get_table_cards())

        self.player_hands[player_uid].update(table_cards)

        self._send_add_to_player_hand(player_uid, table_cards)
        self._send_remove_from_deck(len(table_cards))

        self.table_stacks = []

        self._send_clear_table()

        self._advance_spotlight()
        self._end_follow_phase()

    def _end_follow_phase(self):
        self.phase = 'init'

        for uid, name in self.players:
            self._send_update(uid, {
                'change': 'PHASE',
                'phase': 'init'
            })

        self._send_add_to_played_deck(len(list(self._get_table_cards())))
        self.table_stacks = []
        self._send_clear_table()

        self._hand_out_cards()

    # Reaction TODO: think of a better name, LOL

    def add_update_handler(self, handler): # TODO: rename them to update handlers
        self._update_handlers.add(handler)

        return lambda: self._update_handlers.remove(handler)

    def _send_update(self, player_uid, message):
        for handler in self._update_handlers:
            handler(player_uid, message)

    def _send_remove_from_hand(self, player_uid, card):
        for i, (uid, name) in enumerate(self.players):
            if player_uid == uid:
                self._send_update(uid, {
                    'change': 'REMOVE FROM PLAYER HAND',
                    'card': card.as_dict()
                })
            else:
                self._send_update(uid, {
                    'change': 'REMOVE FROM OPPONENT HAND',
                    'i_opponent': self._relative_index_of_other_player(uid, player_uid) - 1
                })

    def _send_add_to_player_hand(self, player_uid, cards):
        for i, (uid, name) in enumerate(self.players):
            if player_uid == uid:
                self._send_update(uid, {
                    'change': 'ADD TO PLAYER HAND',
                    'cards': [c.as_dict() for c in cards]
                })
            else:
                self._send_update(uid, {
                    'change': 'ADD TO OPPONENT HAND',
                    #vvv TODO: unify case in these messages (camel case as in JS or underscore as in Python)
                    'i_opponent': self._relative_index_of_other_player(uid, player_uid) - 1,
                    'numCards': len(cards)
                })

    def _send_clear_table(self):
        for uid, name in self.players:
            self._send_update(uid, {
                'change': 'CLEAR TABLE'
            })

    def _send_remove_from_deck(self, num_cards):
        for uid, name in self.players:
            self._send_update(uid, {
                'change': 'REMOVE FROM DECK',
                'numCards': num_cards
            })

    def _send_add_to_played_deck(self, num_cards):
        for uid, name in self.players:
            self._send_update(uid, {
                'change': 'ADD TO PLAYED DECK',
                'numCards': num_cards
            })

    # Representation

    def as_dict_for_player(self, player_uid):
        i_player = self._index_of_player(player_uid)

        shifted_opponents = self.players[i_player + 1:] + self.players[:i_player]

        return {
            'numPlayers': len(self.players),

            'currentPhase': self.phase,
            'currentActor': (self._index_of_player(self.spotlight) - i_player) % len(self.players),
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
