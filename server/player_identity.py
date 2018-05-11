import uuid

from tinydb import TinyDB, Query

from game_state import GAME_DECK_MODES


class PlayerIdentity(object):
    db = TinyDB('db.json')

    instances = {}

    def __init__(self, uid, nickname, num_played=0, num_won=0, num_left=0,
                 mm_deck='dont-care', mm_min_players=2, is_new=False):
        self._uid = uid
        self._nickname = nickname

        self._num_played = num_played
        self._num_won = num_won
        self._num_left = num_left

        self._mm_deck = mm_deck
        self._mm_min_players = mm_min_players

        # TODO: do something to prevent leaks
        self.instances[uid] = self

        if is_new:
            # TODO: get rid of this param -- like, always, try to get, then insert if nothing
            self.db.insert(self.as_dict())

    def __eq__(self, other):
        return self.uid == other.uid

    def __ne__(self, other):
        return self.uid != other.uid

    def __hash__(self):
        return hash(self.uid)

    def __str__(self):
        return "<PlayerID {}>".format(self._nickname.encode('utf-8'))

    def __repr__(self):
        return "<PlayerID {}, {}, {}/{}, settings {} {}>".format(
            self.uid,
            self._nickname.encode('utf-8'),
            self._num_played, self._num_won,
            self._mm_deck, self._mm_min_players
        )

    def _dump(self):
        self.db.update(self.as_dict(), Query().uid == self.uid)

    def __del__(self):
        self._dump()

    def as_dict(self):
        return {
            'uid': self.uid,
            'nickname': self._nickname,

            'num_played': self._num_played,
            'num_won': self._num_won,
            'num_left': self._num_left,

            'mm_deck': self._mm_deck,
            'mm_min_players': self._mm_min_players,
        }

    @property
    def uid(self):
        return self._uid

    @property
    def nickname(self):
        return self._nickname

    @nickname.setter
    def nickname(self, v):
        self._nickname = v

        self._dump()

    MM_DECK_VALUES = ('dont-care',) + GAME_DECK_MODES
    MM_MIN_PLAYERS_VALUES = (2, 3, 4, 5, 6,)

    @property
    def mm_deck(self):
        return self._mm_deck

    @mm_deck.setter
    def mm_deck(self, v):
        if v not in self.MM_DECK_VALUES:
            raise ValueError("Illegal value %s for mm deck" % v)

        self._mm_deck = v
        self._dump()

    @property
    def mm_min_players(self):
        return self._mm_min_players

    @mm_min_players.setter
    def mm_min_players(self, v):
        if v not in self.MM_MIN_PLAYERS_VALUES:
            raise ValueError("Illegal value %s for mm min players" % v)

        self._mm_min_players = v
        self._dump()

    @property
    def num_played(self):
        return self._num_played

    @property
    def num_won(self):
        return self._num_won

    @property
    def num_left(self):
        return self._num_left

    def count_win(self):
        self._num_played += 1
        self._num_won += 1

        self._dump()

    def count_loss(self):
        self._num_played += 1

        self._dump()

    def count_leave(self):
        self._num_played += 1
        self._num_left += 1

        self._dump()

    @classmethod
    def from_uid(cls, uid):
        if uid in cls.instances:
            return cls.instances[uid]

        d = cls.db.get(Query().uid == uid)

        if d is not None:
            x = cls(**d)

            return x

        return None

    @classmethod
    def create_new(cls):
        uid = str(uuid.uuid1())  # This line is where all uids are generated

        return cls(uid, nickname="Player %s" % uid[:4], is_new=True)


if __name__ == '__main__':
    db = PlayerIdentity.db

    for d in db:
        p = PlayerIdentity(**d)

        print u"{:<40} {:<20} {:>4} {:>4} {:>4} - {:<10} {}".format(
            p.uid,
            p.nickname,
            p.num_played, p.num_won, p.num_left,
            p.mm_deck, p.mm_min_players
        ).encode('utf-8')
