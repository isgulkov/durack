from random import SystemRandom
import logging

from timer import Timer


def urandom_shuffle_inplace(xs):
    """
    Shuffle list `xs` in-place using Knuth shuffle.

    The randomness is taken from `random.SystemRandom`, which is supposed to use 'urandom' or its equivalent.
    """

    rnd = SystemRandom()

    for i in xrange(len(xs) - 1):
        j = rnd.randint(i, len(xs) - 1)

        xs[i], xs[j] = xs[j], xs[i]


def urandom_shuffled(xs):
    """
    Returns a list of all items from `xs` iterator shuffled using "inside-out" Knuth shuffle.

    The randomness is taken from `random.SystemRandom`, which is supposed to use 'urandom' or its equivalent.
    """

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
    """
    Represents the collective state of a game between several players.
    """

    logger = logging.getLogger('durack/game')

    MOVE_TIME = 10.1
    BUMP_TIME = 3

    # Creation and initialization

    def __init__(self, players, player_hands, table_stacks, leftover_deck, played_deck, bottom_card):
        """
        Construct a game state from "raw materials". The resulting state is not guaranteed to be suitable to start a
        game -- use `create_random`.
        """

        self.phase = 'init'
        self.spotlight = players[0][0]

        self.frozen = False

        self.end_summary = None

        self.players = players
        self.player_hands = player_hands

        self.is_playing = {uid: True for uid, name in self.players}
        self.is_watching = {uid: True for uid, name in self.players}

        self.table_stacks = table_stacks

        self.leftover_deck = leftover_deck[:2]  ## TODO: remove after testing game end
        self.played_deck = played_deck

        self.bottom_card = bottom_card

        self.end_move_votes = [False for _ in players]

        self._update_handlers = set()

        self._move_timer = Timer(on_fire=self._end_phase_on_timeout, on_reset=self._send_reset_timer)

        self.disconnected_players = set()

        self.order_disconnected = []
        self.order_won = []

    @classmethod
    def create_random(cls, players):
        """
        Return an initial game state with the deck shuffled and players in random order.
        """

        deck = Card.get_shuffled_deck()

        bottom_card = deck[0]

        player_hands = {}

        for uid, name in players:
            player_hands[uid] = set(deck.pop() for _ in xrange(6))

        ordered_players = list(players)
        urandom_shuffle_inplace(ordered_players)

        cls._choose_first_player(bottom_card.suit, ordered_players, player_hands)

        return GameState(ordered_players, player_hands, [], deck, [], bottom_card)

    @staticmethod
    def _choose_first_player(trump_suit, players, player_hands):
        """
        Rotate the `players` list such that the player that should move the first comes first.

        Consider all the cards players have on their hands:
        - if there are some trump cards, choose the player that has the trump card of the lowest rank;
        - otherwise, choose a player that has a card with the lowest rank.
        """

        i_start = None

        min_value = 1000

        for i, (uid, name) in enumerate(players):
            for card in player_hands[uid]:
                card_value = (card.suit != trump_suit) * 100 + card.rank_value

                if card_value < min_value:
                    min_value = card_value
                    i_start = i

        players[0:] = players[i_start:] + players[:i_start]

    def start(self):
        """
        Start game -- send players their initial state views and start the move timer
        """

        for uid, name in self.players:
            self._send_initialize(uid)

        self._move_timer.reset(self.MOVE_TIME)

    # Observer management

    # def update_reset_timer_callback(self, callback):
    #     self._reset_timer_callback = callback
    #
    # def update_bump_timer_callback(self, callback):
    #     self._bump_timer_callback = callback
    #
    # def update_pause_timer_callback(self, callback):
    #     self._pause_timer_callback = callback
    #
    # def update_resume_timer_callback(self, callback):
    #     self._resume_timer_callback = callback
    #
    # def update_get_timer_delay_callback(self, callback):
    #     self._get_timer_delay_callback = callback

    def update_end_game_callback(self, callback):
        self._end_game_callback = callback

    def add_update_handler(self, handler):
        """
        Add a handler that will be called by `_send_update()` to send to players state updates in form of deltas to
        their view of the game state.

        The handler is called with two arguments:
        - `player_uid`: an opaque unique identifier of the player for whom the update is intended to;
        - `msg`: state delta in form of a dict encoded for the client software.
        """

        self._update_handlers.add(handler)

        return lambda: self._update_handlers.remove(handler)

    # Connection persistence

    def handle_disconnect(self, player_uid, reconnect_time):
        """
        Handle the specified player disconnecting from the server (i.e. losing network connection). Pause the game until
        they either reconnect or time out.
        """

        if player_uid not in self.disconnected_players:
            self._send_disconnected(player_uid, reconnect_time)

            self.disconnected_players.add(player_uid)

            self._move_timer.pause()

    def handle_reconnect(self, player_uid):
        """
        Handle the specified player reconnecting to the server (i.e. restoring network connection). Resume the game if
        no other players are disconnected.
        """

        self._send_initialize(player_uid)

        if player_uid in self.disconnected_players:
            self.disconnected_players.remove(player_uid)

            self._send_reconnected(player_uid)

            if len(self.disconnected_players) == 0:
                self._move_timer.resume()
        else:
            self.logger.error("Reconnect came for %s, who isn't disconnected" % player_uid)

    def handle_disconnect_timeout(self, player_uid):
        """
        Handle the specified player timing out in the disconnected state. Count them out of the game and continue, if no
        other players are disconnected.
        """

        self.is_watching[player_uid] = False

        self._send_timed_out(player_uid)

        self._apply_player_out_of_game(player_uid, True)

        self._send_player_out_of_game(player_uid)

        if self.spotlight == player_uid:
            self._end_phase_on_timeout()

        self._send_add_to_played_deck(len(self.player_hands[player_uid]))

        while len(self.player_hands[player_uid]) != 0:
            card = self.player_hands[player_uid].pop()

            self._send_remove_from_hand(player_uid, card)

            self.played_deck.append(card)

        if self._game_will_end():
            self._end_the_game()

        if player_uid in self.disconnected_players:
            self.disconnected_players.remove(player_uid)

        if len(self.disconnected_players) == 0:
            self._move_timer.resume()

    # Timer state

    def handle_timer_set(self, delay):
        self._send_reset_timer(delay)

    # Information about state

    def _index_of_player(self, player_uid):
        """
        Get index of the specified player on the playing field.
        """

        for i, (uid, name) in enumerate(self.players):
            if uid == player_uid:
                return i
        else:
            raise ValueError("No player with uid `%s` in the game" % player_uid)

    def _relative_index_of_other_player(self, this_player, other_player):
        """
        Get index of `other_player` on `this_player`'s playing field view.
        """

        i_this_player = self._index_of_player(this_player)
        i_other_player = self._index_of_player(other_player)

        return (i_other_player - i_this_player) % len(self.players)

    def _get_table_cards(self):
        """
        Get all cards currently on the table (in no particular order).
        """

        for stack in self.table_stacks:
            yield stack['top']

            if stack['bottom'] is not None:
                yield stack['bottom']

    def _get_num_empty_stacks(self):
        """
        Get the number of stacks currently on the table that aren't covered (have no 'bottom' card).
        """

        return sum(1 for stack in self.table_stacks if stack['bottom'] is None)

    def _get_next_player(self):
        """
        Get the uid of the next player in order to take `spotlight`.
        """

        i_next_player = self._index_of_player(self.spotlight) + 1
        i_next_player %= len(self.players)

        while not self.is_playing[self.players[i_next_player][0]]:
            # Skip out of game players

            i_next_player += 1
            i_next_player %= len(self.players)

        return self.players[i_next_player][0]

    def _get_defending_player(self):
        """
        Get the uid of the player against whom the moves are made.
        """

        if self.phase == 'follow':
            return self.spotlight
        elif self.phase == 'init':
            return self._get_next_player()
        else:
            raise ValueError("Illegal `phase` value")

    # Predicates on state

    def _is_valid_put_move(self, player_uid, card):
        """
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
        """

        if (self.phase == 'init' and self.spotlight != player_uid) \
                or (self.phase == 'follow' and self.spotlight == player_uid):
            return False

        if not any(uid == player_uid for uid, _ in self.players):
            # TODO: just check if it's in `self.player_hands` for now?

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
        """
        Return if the specified player can make a put move with any of his cards.
        """

        # TODO: refactor this check?
        for card in self.player_hands[player_uid]:
            if self._is_valid_put_move(player_uid, card):
                return True

        return False

    def _is_valid_defend_move(self, player_uid, card, i_stack):
        """
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
        """

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
        """
        Return if the specified player can perform the take move.

        Accepts if and only if all of the following is true:
        - the phase is 'follow';
        - the spotlight is on the player;
        - there are cards on the table.
        """

        if self.spotlight != player_uid:
            return False

        if self.phase != 'follow':
            return False

        if len(self.table_stacks) == 0:
            return False

        return True

    def _follow_phase_will_continue(self):
        """
        Return if the current 'follow' phase will continue on the last move.

        The decision process is as follows:

        1. Accept if there are any uncovered stacks on the table.
        2. Decline if the spotlight player has no more cards in his hand.
        3. Accept if a put move possible by any of the players who have not yet voted to end move.
        4. Decline otherwise.
        """

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

    def _game_has_ended(self):
        """
        Return whether the game is already declared finished with the end summary populated
        """

        return self.end_summary is not None

    def _game_will_end(self):
        """
        Return whether the game should be declared finished at this point
        """

        return sum(1 for uid, name in self.players if self.is_playing[uid]) <= 1

    def _is_frozen(self):
        return self.frozen

    # Mutation of state

    def _opt_end_move(self, i_player):
        """
        Register `i_player`th player's vote to end the current 'follow' phase.
        """

        if not self.end_move_votes[i_player]:
            self._send_update(self.players[i_player][0], {
                'change': 'OPTED TO END MOVE'
            })

        self.end_move_votes[i_player] = True

    def _end_phase_on_timeout(self):
        """
        Abruptly end the current phase because the move timer has ran out.

        - In the 'init' phase:
          - if any cards have been put on the table, proceed to the corresponding 'follow';
          - otherwise, proceed to the following 'init'.
        - In the 'follow' phase:
          - if there are any uncovered stacks, end follow phase normally and move to the following 'init';
          - otherwise, consider the run out as a take move on part of the spotlight player.
        """

        if self._game_has_ended():
            # Reject any timer events after the end of the game

            return

        if self.phase == 'init':
            self._end_init_phase()
        elif self.phase == 'follow':
            if self._get_num_empty_stacks() == 0:
                self._end_follow_phase()
            else:
                self._apply_take_move(self.spotlight)

    def _reset_all_end_move_votes(self):
        # TODO: strictly define when these are reset
        # TODO: for example, reset for a particular player only if they can follow with a new card on his hand
        self.end_move_votes = [False for _ in self.players]

    def process_move(self, player_uid, move):
        """
        Apply the specified move by the specified player is such move is valid.

        Raises:
            IllegalMoveException: the specified move by the specified player is an invalid move.
        """

        # TODO: add type checks to the tops of methods and shit

        # TODO: extract methods related to moves into individual Move classes, methods related to update notifications
        # TODO: into separate "Notifier" class, method related to player state into separate Player class.
        # TODO: This is 550 LOC already ffs

        if self._is_frozen() or self._game_has_ended():
            # Reject any moves after the game end or while frozen (waiting for the disconnected)

            return

        if move['action'] == 'MOVE PUT':
            card = Card.from_dict(move['card'])

            if not self._is_valid_put_move(player_uid, card):
                raise IllegalMoveException(move, self.as_dict())

            self._apply_put_move(player_uid, card)
        elif move['action'] == 'MOVE DEFEND':
            card = Card.from_dict(move['card'])
            i_stack = move['iStack']

            if not self._is_valid_defend_move(player_uid, card, i_stack):
                raise IllegalMoveException(move, self.as_dict())

            self._apply_defend_move(player_uid, card, i_stack)
        elif move['action'] == 'MOVE TAKE':
            if not self._is_valid_take_move(player_uid):
                raise IllegalMoveException(move, self.as_dict())

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

        # TODO: don't throw exceptions on illegal moves, just return?

    def _apply_put_move(self, player_uid, card):
        """
        Apply the move by the specified player to put the specified card. If another put by the player is not possible,
        end the current 'init' phase.

        Note: the move is assumed to be valid and applied unconditionally.
        """

        self.player_hands[player_uid].remove(card)

        self.table_stacks.append({
            'top': card,
            'bottom': None
        })

        self._send_put_on_table(card)

        self._send_remove_from_hand(player_uid, card)

        if self.phase == 'init' and not self._put_possible(player_uid):
            self._end_init_phase()
        else:
            self._move_timer.bump(self.BUMP_TIME)

        self._reset_all_end_move_votes()

    def _end_init_phase(self):
        """
        End the current 'init' phase and transition into:
        - the corresponding 'follow' phase, if any cards have been put on the table;
        - the next 'init' phase if no cards have been put (i.e. move timer ran out).
        """

        if self.phase != 'init':
            raise ValueError("Not in init phase")

        self._advance_spotlight()

        if len(self.table_stacks) != 0:
            self.phase = 'follow'

            self._send_phase()

        self._move_timer.reset(self.MOVE_TIME)

    def _advance_spotlight(self):
        """
        Advances the spotlight to the next player in order, skipping the players that are out of game.
        """

        i_next = self._index_of_player(self.spotlight) + 1
        i_next %= len(self.players)

        # Skip out of game players
        while not self.is_playing[self.players[i_next][0]]:
            i_next += 1
            i_next %= len(self.players)  # Loop back

        self.spotlight = self.players[i_next][0]

        self._send_spotlight()

    def _apply_defend_move(self, player_uid, card, i_stack):
        """
        Apply the move by the specified player to defend by coverting `i_stack`th stack with `card`.

        Note: the move is assumed to be valid and applied unconditionally.
        """

        self.player_hands[player_uid].remove(card)

        self.table_stacks[i_stack]['bottom'] = card

        self._send_remove_from_hand(player_uid, card)

        self._send_cover_stack(i_stack, card)

        # TODO: Reset only selectively (see TODO inside the method)
        self._reset_all_end_move_votes()

        if not self._follow_phase_will_continue():
            self._end_follow_phase()
        else:
            self._move_timer.bump(self.BUMP_TIME)

    def _hand_out_cards(self):
        """
        Hand cards out, i.e move the appropriate number of cards (possibly zero) from the top of the leftover deck into
        the hand of each in-game player so that all of them have at least 6 cards.

        The in-game players are considered in order, starting from the spotlight. If at some point the leftover deck
        runs out, the process is halted.
        """

        i_spotlight = self._index_of_player(self.spotlight)

        players = self.players[i_spotlight:] + self.players[:i_spotlight]

        additional_cards = [[] for _ in players]

        for i, (uid, name) in enumerate(players):
            if not self.is_playing[uid]:
                continue

            while len(self.player_hands[uid]) + len(additional_cards[i]) < 6 and len(self.leftover_deck) != 0:
                additional_cards[i].append(self.leftover_deck.pop())

        for cards, (uid, name) in zip(additional_cards, players):
            self.player_hands[uid].update(cards)

            self._send_add_to_player_hand(uid, cards)

        self._send_remove_from_deck(sum(len(cards) for cards in additional_cards))

    def _apply_take_move(self, player_uid):
        """
        Apply take move by the specified player.

        Note: the move is assumed to be valid and applied unconditionally.
        """

        table_cards = list(self._get_table_cards())

        self.player_hands[player_uid].update(table_cards)

        self._send_add_to_player_hand(player_uid, table_cards)

        self.table_stacks = []

        self._send_clear_table()

        self._advance_spotlight()
        self._end_follow_phase()

    def _end_follow_phase(self):
        """
        End the current 'follow' phase and proceed into the corresponding next 'init' phase.

        Note: it is assumed that it is not 'follow' phase and it should end.
        """

        self.phase = 'init'

        self._send_phase()

        self._send_add_to_played_deck(sum(1 for _ in self._get_table_cards()))

        self.table_stacks = []

        self._send_clear_table()

        self._hand_out_cards()

        # Mark players that have no cards left after the handout as out of game
        for uid, name in self.players:
            if self.is_playing[uid] and len(self.player_hands[uid]) == 0:
                self._apply_player_out_of_game(uid)

                self._send_player_out_of_game(uid)

        # Only one player left in the game -- announce game end
        if self._game_will_end():
            self._end_the_game()

            return

        # Advance spotlight only if the former defending player went out of game, otherwise it's his turn now
        if not self.is_playing[self.spotlight]:
            self._advance_spotlight()

        self._move_timer.reset(self.MOVE_TIME)

    def _apply_player_out_of_game(self, player_uid, disconnect=False):
        """
        Mark the specified player as out of game.

        Note: is is assumed that the player is in game.
        """

        self.is_playing[player_uid] = False

        if disconnect:
            self.order_disconnected.append(player_uid)
        else:
            self.order_won.append(player_uid)

    def _end_the_game(self):
        """
        Declare the game finished by forming an end summary.

        Note: the game is assumed to be in the state where it should be declared finished, with only one player left in
        """

        loser = None

        for player, name in self.players:
            if self.is_playing[player]:
                loser, loser_nickname = player, name
                break

        self.end_summary = {
            'loser': loser
        }

        self._send_game_end()

        self._end_game_callback([player for player, name in self.players])

    def _freeze(self):
        """
        Freeze the game UI -- prevent players from making any moves
        """

        self.frozen = True

    def _unfreeze(self):
        """
        Unfreeze the game UI -- allow players to make moves again
        """

        self.frozen = False

    # Client state update

    @property
    def current_players(self):
        """
        Yield only the players currently watching the game (i.e. receiving updates)
        """

        # TODO: handle this outside the game state and in the server?

        for uid, name in self.players:
            if self.is_watching[uid]:
                yield uid, name

    def _send_update(self, player_uid, msg):
        """
        Update *the specified player* on the delta `msg`
        """

        for handler in self._update_handlers:
            handler(player_uid, msg)

    def _send_update_to_all(self, msg):
        """
        Update *all players* on the delta `msg`
        """

        for uid, name in self.current_players:
            self._send_update(uid, msg)

    def _send_disconnected(self, player_uid, reconnect_time):
        """
        Update *each player* that the specified player has disconnected and has `reconnect_time` seconds left to
        reconnect.
        """

        for uid, name in self.current_players:
            if uid == player_uid:
                continue

            self._send_update(uid, {
                'type': 'player-disconnected',
                'iPlayer': self._relative_index_of_other_player(uid, player_uid),
                'secondsLeft': reconnect_time
            })

    def _send_reconnected(self, player_uid):
        """
        Update *each player* that the specified player has reconnected.
        """

        for uid, name in self.current_players:
            if uid == player_uid:
                continue

            self._send_update(uid, {
                'type': 'player-reconnected',
                'iPlayer': self._relative_index_of_other_player(uid, player_uid)
            })

    def _send_timed_out(self, player_uid):
        """
        Update *each player* that the specified player has timed out and is thus now out of the game.
        """

        for uid, name in self.current_players:
            if uid == player_uid:
                continue

            self._send_update(uid, {
                'type': 'player-timed-out',
                'iPlayer': self._relative_index_of_other_player(uid, player_uid)
            })

    def _send_initialize(self, player_uid):
        """
        Update the specified player with the current game state in full
        """

        self._send_update(player_uid, {
            'type': 'INITIALIZE GAME',
            'game': self.as_dict_for_player(player_uid)
        })

    def _send_reset_timer(self, new_delay):
        """
        Update *all players* on the move timer being reset to the specified delay
        """

        self._send_update_to_all({
            'change': 'timer-move-set',
            'numSeconds': new_delay
        })

    def _send_put_on_table(self, card):
        """
        Update *all players* about `card` being put on the table forming a new table stack
        """

        self._send_update_to_all({
            'change': 'PUT ON TABLE',
            'card': card.as_dict()
        })

    def _send_phase(self):
        """
        Update *all players* on current phase
        """

        self._send_update_to_all({
            'change': 'PHASE',
            'phase': self.phase
        })

    def _send_spotlight(self):
        """
        Update *each player* on the current spotlight position, providing its relative index.
        """

        for uid, name in self.current_players:
            self._send_update(uid, {
                'change': 'SPOTLIGHT',
                'iSpotlight': self._relative_index_of_other_player(uid, self.spotlight)
            })

    def _send_cover_stack(self, i_stack, card):
        """
        Update *all players* on `card` being used to cover `i_stack`th stack
        """

        self._send_update_to_all({
            'change': 'PUT ONTO STACK',
            'iStack': i_stack,
            'card': card.as_dict()
        })

    def _send_remove_from_hand(self, player_uid, card):
        """
        Update *each player* on the specified card being removed from the specified player's hand. The opponents are
        only provided with the player's relative index.
        """

        for i, (uid, name) in enumerate(self.current_players):
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
        """
        Update *each player* of `cards` being added to the specified player's hand.

        To the specified player himself, provide the cards. To the other players, provide the number for cards added and
        the corresponding opponent's hand.
        """

        for i, (uid, name) in enumerate(self.current_players):
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
        """
        Update *all players* on all the table stacks being removed from the table.
        """
        for uid, name in self.current_players:
            self._send_update(uid, {
                'change': 'CLEAR TABLE'
            })

    def _send_remove_from_deck(self, num_cards):
        """
        Update *all players* on `num_cards` being removed from the leftover deck.
        """
        self._send_update_to_all({
            'change': 'REMOVE FROM DECK',
            'numCards': num_cards
        })

    def _send_add_to_played_deck(self, num_cards):
        """
        Update *all players* on `num_cards` being added to the played deck.
        """
        self._send_update_to_all({
            'change': 'ADD TO PLAYED DECK',
            'numCards': num_cards
        })

    def _send_player_out_of_game(self, player_uid):
        """
        Update *each players* on the specified player going out of game (i.e. winning).

        To each provide the relative index of the player in their respective views.
        """

        for uid, name in self.current_players:
            self._send_update(uid, {
                'change': 'PLAYER OUT OF GAME',
                'iPlayer': self._relative_index_of_other_player(uid, player_uid)
            })

    def _send_game_end(self):
        self._send_update_to_all({
            'change': 'GAME ENDED'
        })

    # Representation

    def get_broader_end_summary(self, player):
        """
        Return a broader end game summary for the specified player's end game menu screen.
        """

        loser = self.end_summary['loser']

        if loser is None:
            loser_nickname = None
            loser_is_you = False
        else:
            loser_nickname = self.players[self._index_of_player(loser)][1]
            loser_is_you = player == loser

        return {
            'loserNickname': loser_nickname,
            'loserIsYou': loser_is_you,
            'orderWon':
                [self.players[self._index_of_player(uid)][1] for uid in self.order_won],
            'iYou':
                self.order_won.index(player) if player in self.order_won else None,
            'orderDisconnected':
                [self.players[self._index_of_player(uid)][1] for uid in self.order_disconnected]
        }

    def as_dict(self):
        return {
            'players': self.players,

            'currentPhase': self.phase,
            'iSpotlight': self._index_of_player(self.spotlight),

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
            'iSpotlight': (self._index_of_player(self.spotlight) - i_player) % len(self.players),

            'playerHand': [card.as_dict() for card in self.player_hands[player_uid]],

            'tableStacks': [
                {
                    'top': stack['top'].as_dict(),
                    'bottom': stack['bottom'].as_dict() if stack['bottom'] is not None else None
                } for stack in self.table_stacks
            ],

            'opponents': [
                {
                    'nickname': name,
                    'numCards': len(self.player_hands[uid]),
                    'inGame': self.is_playing[uid]
                } for (uid, name) in shifted_opponents
            ],

            'leftoverDeckSize': len(self.leftover_deck),
            'bottomCard': self.bottom_card.as_dict(),

            'playedDeckSize': len(self.played_deck),

            'playersDisconnected': {
                self._relative_index_of_other_player(player_uid, uid):
                    { 'numSeconds': 30 } for uid in self.disconnected_players if uid != player_uid
            }
        }


if __name__ == '__main__':
    for c in Card.get_shuffled_deck():
        print c,

    print
