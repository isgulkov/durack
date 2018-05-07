from random import SystemRandom
import logging


def urandom_shuffle_inplace(xs):
    '''
    Shuffle list `xs` in-place using Knuth shuffle.

    The randomness is taken from `random.SystemRandom`, which is supposed to use 'urandom' or its equivalent.
    '''

    rnd = SystemRandom()

    for i in xrange(len(xs) - 1):
        j = rnd.randint(i, len(xs) - 1)

        xs[i], xs[j] = xs[j], xs[i]


def urandom_shuffled(xs):
    '''
    Returns a list of all items from `xs` iterator shuffled using "inside-out" Knuth shuffle.

    The randomness is taken from `random.SystemRandom`, which is supposed to use 'urandom' or its equivalent.
    '''

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
    def __init__(self, move, state_repr):
        self.move = move
        self.state_repr = state_repr

    def __repr__(self):
        return "IllegalMoveException[move `%s` in state `%s`)" % (self.move, self.state_repr, )


class Card:
    suits = ('hearts', 'diamonds', 'clubs', 'spades')
    ranks = ('2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A')

    @classmethod
    def all_cards(cls):
        for suit in cls.suits:
            for rank in cls.ranks:
                yield Card(suit, rank)

    @classmethod
    def get_shuffled_deck(cls):
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

    @classmethod
    def from_dict(Cls, dict_card):
        return Cls(dict_card['suit'], dict_card['rank'])

    def as_dict(self):
        return {
            'suit': self.suit,
            'rank': self.rank
        }


class GameState:
    def __init__(self, players, player_hands, table_stacks, leftover_deck, played_deck, bottom_card):
        self.phase = 'init'
        self.spotlight = players[0][0]

        # TODO: identify players by cookies rather then connection objects to support reconnect
        self.players = players  # TODO: Replace with just uids instead of tuples, put nicknames into a separate dict
        self.player_hands = player_hands

        self.in_game = {uid: True for uid, name in self.players}

        self.table_stacks = table_stacks

        self.leftover_deck = leftover_deck[:2]  ## TODO: remove after testing game end
        self.played_deck = played_deck

        self.bottom_card = bottom_card

        self.end_move_votes = [False for _ in players]

        self._update_handlers = set()

    # Creation

    @classmethod
    def random_state(cls, players):
        deck = Card.get_shuffled_deck()

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

    def initialize(self):
        for uid, name in self.players:
            self._send_update(uid, {
                'type': 'INITIALIZE GAME',
                'init_state': self.as_dict_for_player(uid)
            })

        self._set_timer(10)

    # Information about state

    def _index_of_player(self, player_uid):
        '''
        Get index of the specified player on the playing field.
        '''

        # TODO; do something about all these indices (put in hash table ?)
        for i, (uid, name) in enumerate(self.players):
            if uid == player_uid:
                return i
        else:
            raise ValueError("No player with uid `%s` in the game" % player_uid)

    def _relative_index_of_other_player(self, this_player, other_player):
        '''
        Get index of `other_player` on `this_player`'s playing field view.
        '''

        i_this_player = self._index_of_player(this_player)
        i_other_player = self._index_of_player(other_player)

        return (i_other_player - i_this_player) % len(self.players)

    def _get_table_cards(self):
        '''
        Get all cards currently on the table (in no particular order).
        '''

        for stack in self.table_stacks:
            yield stack['top']

            if stack['bottom'] is not None:
                yield stack['bottom']

    def _get_num_empty_stacks(self):
        '''
        Get the number of stacks currently on the table that aren't covered (have no 'bottom' card).
        '''

        return sum(1 for stack in self.table_stacks if stack['bottom'] is None)

    def _get_next_player(self):
        '''
        Get the uid of the next player in order to take `spotlight`.
        '''

        # TODO: skip out of game players!
        # TODO: use this where needed
        return self.players[(self._index_of_player(self.spotlight) + 1) % len(self.players)][0]

    def _get_defending_player(self):
        '''
        Get the uid of the player against whom the moves are made.
        '''

        if self.phase == 'follow':
            return self.spotlight
        elif self.phase == 'init':
            return self._get_next_player()
        else:
            raise ValueError("Illegal `phase` value")

    # Predicates on state

    def _is_valid_put_move(self, player_uid, card):
        '''
        Return if `card` being put by the specified player is a valid put move.

        The decision process is as follows:

        1. Decline if any of the following is true:
           - phase is 'init' and spotlight isn't the player, or
           - phase is 'follow' and spotlight is on the player;
           - player doesn't have `card` in his hand.
        2. Accept if there are no stacks on the table.
        3. Decline if there are already as many uncovered stacks on the table as the defending player has cards.
        4. Accept if there are cards on table of the same rank as `card`.
        5. Decline otherwise.
        '''

        if (self.phase == 'init' and self.spotlight != player_uid) \
                or (self.phase == 'follow' and self.spotlight == player_uid):
            return False

        if not any(uid == player_uid for uid, _ in self.players):
            return False

        if card not in self.player_hands[player_uid]:
            return False

        if len(self.table_stacks) == 0:
            return True

        num_empty_stacks = self._get_num_empty_stacks()

        if num_empty_stacks == len(self.player_hands[self._get_defending_player()]):
            return False

        for table_card in self._get_table_cards():
            if table_card.rank == card.rank:
                return True

        return False

    def _put_possible(self, player_uid):
        '''
        Return if the specified player can make a put move with any of his cards.
        '''

        # TODO: refactor this check?
        for card in self.player_hands[player_uid]:
            if self._is_valid_put_move(player_uid, card):
                return True

        return False

    def _is_valid_defend_move(self, player_uid, card, i_stack):
        '''
        Return if `card` being used by the specified player to cover `i_stack`th stack is a valid defend move.

        The decision process is as follows:

        1. Decline if any of the following is true:
           - the phase isn't 'follow' or the spotlight isn't on the player;
           - player doesn't have `card` in his hand;
           - `i_stack` isn't an index of one of the stacks currently on the table;
           - `i_stack`th stack is already covered.
        2. Accept if either is true:
           - `card` and the stack's top card have the same suit, and `card`'s rank is higher;
           - `card` is of trump suit and the stack's top card isn't.
        3. Decline otherwise.
        '''

        if self.phase != 'follow' or self.spotlight != player_uid:
            return False

        if card not in self.player_hands[player_uid]:
            return False

        if not (0 <= i_stack < len(self.table_stacks)):
            return False

        stack = self.table_stacks[i_stack]

        if stack['bottom'] is not None:
            return False

        top = stack['top']

        if card.suit == top.suit and card.rank_value > top.rank_value:
            return True

        if card.suit == self.bottom_card.suit and top.suit != self.bottom_card.suit:
            return True

        return False

    def _is_valid_take_move(self, player_uid):
        '''
        Return if the specified player can perform the take move.

        Accepts if and only if all of the following is true:
        - the phase is 'follow';
        - the spotlight is on the player;
        - there are cards on the table.
        '''

        if self.spotlight != player_uid:
            return False

        if self.phase != 'follow':
            return False

        if len(self.table_stacks) == 0:
            return False

        return True

    def _follow_phase_will_continue(self):
        '''
        Return if the current 'follow' phase will continue on the last move.

        The decision process is as follows:

        1. Accept if there are any uncovered stacks on the table.
        2. Decline if the spotlight player has no more cards in his hand.
        3. Accept if a put move possible by any of the players who have not yet voted to end move.
        4. Decline otherwise.
        '''

        if any(stack['bottom'] is None for stack in self.table_stacks):
            return True

        if len(self.player_hands[self.spotlight]) == 0:
            return False

        for i, (uid, name) in enumerate(self.players):
            if uid == self.spotlight:
                continue

            if self.end_move_votes[i]:
                continue

            if self._put_possible(uid):
                return True

        return False

    # Mutation of state

    def _set_timer(self, delay):
        self.set_timer(delay)

        for uid, name in self.players:
            self._send_update(uid, {
                'change': 'SET TIMER',
                'numSeconds': delay
            })

    def timeout(self):
        pass # TODO: implement timeout actions

    def _opt_end_move(self, i_player):
        '''
        Register `i_player`th player's vote to end the current 'follow' phase.
        '''

        if not self.end_move_votes[i_player]:
            self._send_update(self.players[i_player][0], {
                'change': 'OPTED TO END MOVE'
            })

        self.end_move_votes[i_player] = True

    def _reset_all_end_move_votes(self):
        # TODO: strictly define when these are reset
        # TODO: for example, reset for a particular player only if they can follow with a new card on his hand
        self.end_move_votes = [False for _ in self.players]

    def process_move(self, player_uid, move):
        '''
        Apply the specified move by the specified player is such move is valid.

        Raises:
            IllegalMoveException: the specified move by the specified player is an invalid move.
        '''

        # TODO: add type checks to the tops of methods and shit

        # TODO: extract methods related to moves into individual Move classes, methods related to update notifications
        # TODO: into separate "Notifier" class, method related to player state into separate Player class.
        # TODO: This is 550 LOC already ffs

        print "Before move:"
        print self.as_dict()

        if move['action'] == 'MOVE PUT':
            card = Card.from_dict(move['card'])

            if not self._is_valid_put_move(player_uid, card):
                raise IllegalMoveException(move, self.as_dict()) # TODO: add details

            self._apply_put_move(player_uid, card)
        elif move['action'] == 'MOVE DEFEND':
            card = Card.from_dict(move['card'])
            i_stack = move['iStack']

            if not self._is_valid_defend_move(player_uid, card, i_stack):
                raise IllegalMoveException(move, self.as_dict())  # TODO: add details

            self._apply_defend_move(player_uid, card, i_stack)
        elif move['action'] == 'MOVE TAKE':
            if not self._is_valid_take_move(player_uid):
                raise IllegalMoveException(move, self.as_dict())  # TODO: add details

            self._apply_take_move(player_uid)
        elif move['action'] == 'MOVE END':
            i_player = self._index_of_player(player_uid)

            if self.phase == 'init' and self.spotlight == player_uid and len(self.table_stacks) != 0:
                self._end_init_phase()

                self._opt_end_move(i_player)
            elif self.phase == 'follow' and self.spotlight != player_uid:
                if self.end_move_votes[i_player]:
                    logging.warn("Player %s voted to end move even though he has already" % self)

                self._opt_end_move(i_player)

                if not self._follow_phase_will_continue():
                    self._end_follow_phase()
        else:
            raise ValueError("Unknown type of move `%s`" % move['action'])

    def _apply_put_move(self, player_uid, card):
        '''
        Apply the move by the specified player to put the specified card. If another put by the player is not possible,
        end the current 'init' phase.

        Note: the move is assumed to be valid and applied unconditionally.
        '''

        self.player_hands[player_uid].remove(card)

        self.table_stacks.append({
            'top': card,
            'bottom': None
        })

        self._send_put_on_table(card)

        self._send_remove_from_hand(player_uid, card)

        if self.phase == 'init' and not self._put_possible(player_uid):
            self._end_init_phase()

        self._reset_all_end_move_votes()

    def _end_init_phase(self):
        '''
        End the current 'init' phase and transition into the corresponding 'move' phase
        '''

        if self.phase != 'init':
            raise ValueError("Not in init phase")

        self._advance_spotlight()

        self.phase = 'follow'

        self._send_phase()

    def _advance_spotlight(self):
        '''
        Advances the spotlight to the next player in order, skipping the players that are out of game.
        '''

        i_next = self._index_of_player(self.spotlight) + 1
        i_next %= len(self.players)

        # Skip out of game players
        while not self.in_game[self.players[i_next][0]]:
            i_next += 1
            i_next %= len(self.players)  # Loop back

        self.spotlight = self.players[i_next][0]

        self._send_spotlight()

    def _apply_defend_move(self, player_uid, card, i_stack):
        '''
        Apply the move by the specified player to defend by coverting `i_stack`th stack with `card`.

        Note: the move is assumed to be valid and applied unconditionally.
        '''

        self.player_hands[player_uid].remove(card)

        self.table_stacks[i_stack]['bottom'] = card

        self._send_remove_from_hand(player_uid, card)

        self._send_cover_stack(i_stack, card)

        # TODO: Reset only selectively (see TODO inside the method)
        self._reset_all_end_move_votes()

        if not self._follow_phase_will_continue():
            self._end_follow_phase()

        return True

    def _hand_out_cards(self):
        '''
        Hand cards out, i.e move the appropriate number of cards (possibly zero) from the top of the leftover deck into
        the hand of each player so that all players have at least 6 cards.

        The players are considered in order, starting from the spotlight. If at some point the leftover deck runs out,
        the process is halted.
        '''

        i_spotlight = self._index_of_player(self.spotlight)

        players = self.players[i_spotlight:] + self.players[:i_spotlight]

        additional_cards = [[] for _ in players]

        for i, (uid, name) in enumerate(players):
            while len(self.player_hands[uid]) + len(additional_cards[i]) < 6 and len(self.leftover_deck) != 0:
                additional_cards[i].append(self.leftover_deck.pop())

        for cards, (uid, name) in zip(additional_cards, players):
            self.player_hands[uid].update(cards)

            self._send_add_to_player_hand(uid, cards)

        self._send_remove_from_deck(sum(len(cards) for cards in additional_cards))

    def _apply_take_move(self, player_uid):
        '''
        Apply take move by the specified player.

        Note: the move is assumed to be valid and applied unconditionally.
        '''

        table_cards = list(self._get_table_cards())

        self.player_hands[player_uid].update(table_cards)

        self._send_add_to_player_hand(player_uid, table_cards)

        self.table_stacks = []

        self._send_clear_table()

        self._advance_spotlight()
        self._end_follow_phase()

    def _end_follow_phase(self):
        '''
        End the current 'follow' phase and proceed into the corresponding next 'init' phase.

        Note: it is assumed that it is not 'follow' phase and it should end.
        '''

        self.phase = 'init'

        self._send_phase()

        self._send_add_to_played_deck(sum(1 for _ in self._get_table_cards()))

        self.table_stacks = []

        self._send_clear_table()

        self._hand_out_cards()

        # Mark players that have no cards left after the handout as out of game
        for uid, name in self.players:
            if self.in_game[uid] and len(self.player_hands[uid]) == 0:
                self.in_game[uid] = False

                self._send_player_out_of_game(uid)

        # Only one player left in the game -- announce game end
        if sum(1 for uid, name in self.players if self.in_game[uid]) == 1:
            loser_uid = None
            loser_nickname = None

            for uid, name in self.players:
                if self.in_game[uid]:
                    loser_uid, loser_nickname = uid, name
                    break

            self._send_game_end(loser_uid, loser_nickname)

            # TODO: set a flag to prohibit further moves

        # Advance spotlight only if the former defending player went out of game, otherwise it's his turn now
        if not self.in_game[self.spotlight]:
            self._advance_spotlight()


    # Client state update

    def add_set_timer_callback(self, callback):
        self.set_timer = callback

    def add_update_handler(self, handler):
        self._update_handlers.add(handler)

        return lambda: self._update_handlers.remove(handler)

    def _send_update(self, player_uid, msg):
        '''
        Update *the specified player* on the delta `msg`
        '''

        for handler in self._update_handlers:
            handler(player_uid, msg)

    def _send_update_to_all(self, msg):
        '''
        Update *all players* on the delta `msg`
        '''

        for uid, name in self.players:
            self._send_update(uid, msg)

    def _send_put_on_table(self, card):
        '''
        Update *all players* about `card` being put on the table forming a new table stack
        '''

        self._send_update_to_all({
            'change': 'PUT ON TABLE',
            'card': card.as_dict()
        })

    def _send_phase(self):
        '''
        Update *all players* on current phase
        '''

        self._send_update_to_all({
            'change': 'PHASE',
            'phase': self.phase
        })

    def _send_spotlight(self):
        '''
        Update *each player* on the current spotlight position, providing its relative index.
        '''

        for uid, name in self.players:
            self._send_update(uid, {
                'change': 'SPOTLIGHT',
                'iSpotlight': self._relative_index_of_other_player(uid, self.spotlight)
            })

    def _send_cover_stack(self, i_stack, card):
        '''
        Update *all players* on `card` being used to cover `i_stack`th stack
        '''

        self._send_update_to_all({
            'change': 'PUT ONTO STACK',
            'iStack': i_stack,
            'card': card.as_dict()
        })

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
                    'iOpponent': self._relative_index_of_other_player(uid, player_uid) - 1
                })

    def _send_add_to_player_hand(self, player_uid, cards):
        '''
        Update *each player* of `cards` being added to the specified player's hand.

        To the specified player himself, provide the cards. To the other players, provide the number for cards added and
        the corresponding opponent's hand.
        '''

        for i, (uid, name) in enumerate(self.players):
            if player_uid == uid:
                self._send_update(uid, {
                    'change': 'ADD TO PLAYER HAND',
                    'cards': [c.as_dict() for c in cards]
                })
            else:
                self._send_update(uid, {
                    'change': 'ADD TO OPPONENT HAND',
                    'iOpponent': self._relative_index_of_other_player(uid, player_uid) - 1,
                    'numCards': len(cards)
                })

    def _send_clear_table(self):
        '''
        Update *all players* on all the table stacks being removed from the table.
        '''
        for uid, name in self.players:
            self._send_update(uid, {
                'change': 'CLEAR TABLE'
            })

    def _send_remove_from_deck(self, num_cards):
        '''
        Update *all players* on `num_cards` being removed from the leftover deck.
        '''
        self._send_update_to_all({
            'change': 'REMOVE FROM DECK',
            'numCards': num_cards
        })

    def _send_add_to_played_deck(self, num_cards):
        '''
        Update *all players* on `num_cards` being added to the played deck.
        '''
        self._send_update_to_all({
            'change': 'ADD TO PLAYED DECK',
            'numCards': num_cards
        })

    def _send_player_out_of_game(self, player_uid):
        '''
        Update *each players* on the specified player going out of game (i.e. winning).

        To each provide the relative index of the player in their respective views.
        '''

        for uid, name in self.players:
            self._send_update(uid, {
                'change': 'PLAYER OUT OF GAME',
                'iPlayer': self._relative_index_of_other_player(uid, player_uid)
            })

    def _send_game_end(self, loser_uid, loser_nickname):
        '''
        Update *each player* of the game ending and the specified player losing. To each player, provide the loser's
        nickname and whether the player themselves is the loser.
        '''

        for uid, name in self.players:
            self._send_update(uid, {
                'change': 'GAME ENDED',
                'loserNickname': loser_nickname,
                'loserIsYou': loser_uid == uid
            })

    # Representation

    def as_dict(self):
        print self.table_stacks

        return {
            'players': self.players,

            'currentPhase': self.phase,
            'currentActor': self._index_of_player(self.spotlight),

            'playerHands': {uid: [card.as_dict() for card in hand] for uid, hand in self.player_hands.iteritems()},

            'tableStacks': [
                {
                    'top': top.as_dict() if hasattr(top, 'as_dict') else top,
                    'bottom': bottom.as_dict() if hasattr(bottom, 'as_dict') else bottom
                } for (top, bottom) in self.table_stacks
            ],

            'leftoverDeck': self.leftover_deck,
            'bottomCard': self.bottom_card.as_dict(),

            'playedDeck': self.played_deck
        }

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
                    'numCards': len(self.player_hands[uid]),
                    'inGame': self.in_game[uid]
                } for (uid, name) in shifted_opponents
            ],

            # TODO:  vvvvv                         vvvv
            'leftoverStackSize': len(self.leftover_deck),
            'bottomCard': self.bottom_card.as_dict(),

            'playedStackSize': len(self.played_deck)
            # TODO:^^^^^                       ^^^^
        }


if __name__ == '__main__':
    for c in Card.get_shuffled_deck():
        print c,

    print
