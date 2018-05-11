import uuid

from tinydb import TinyDB, Query

from game_state import GAME_DECK_MODES


class PlayerIdentity(object):
    db = TinyDB('db.json')

    def __init__(self, uid, nickname, num_played=0, num_won=0,
                 mm_deck='dont-care', mm_min_players=2, is_new=False):
        self._uid = uid
        self._nickname = nickname
        self._num_played = num_played
        self._num_won = num_won
        self._mm_deck = mm_deck
        self._mm_min_players = mm_min_players

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
        return "<PlayerID {}, {}, {} played, {} won>".format(
            self.uid,
            self._nickname.encode('utf-8'),
            self._num_played, self._num_won
        )

    def _dump(self):
        self.db.update(self.as_dict(), Query().uid == self.uid)

    def as_dict(self):
        return {
            'uid': self.uid,
            'nickname': self._nickname,
            'num_played': self._num_played,
            'num_won': self._num_won
        }

    @property
    def uid(self):
        return self._uid

    @property
    def nickname(self):
        return self._nickname

    @nickname.setter
    def nickname(self, v):
        print "Nickname", self._nickname,

        self._nickname = v

        print "got changed to", self._nickname

        self._dump()

    MM_DECK_VALUES = ('dont-care', ) + GAME_DECK_MODES
    MM_MIN_PLAYERS_VALUES = (2, 3, 4, 5, 6, )

    @property
    def mm_deck(self):
        return self._mm_deck

    @mm_deck.setter
    def mm_deck(self, v):
        if v not in self.MM_DECK_VALUES:
            raise ValueError("Illegal value %s for mm deck" % v)

        self._mm_deck = v

    @property
    def mm_min_players(self):
        return self._mm_min_players

    @mm_min_players.setter
    def mm_min_players(self, v):
        if v not in self.MM_MIN_PLAYERS_VALUES:
            raise ValueError("Illegal value %s for mm min players" % v)

        self._mm_min_players = v

    def count_win(self):
        self._num_played += 1
        self._num_won += 1

        self._dump()

    def count_loss(self):
        self._num_played += 1

        self._dump()

    def count_leave(self):
        pass  # TODO: implement

    @classmethod
    def from_uid(cls, uid):
        d = cls.db.get(Query().uid == uid)

        if d is not None:
            return cls(**d)

        return None

    @classmethod
    def create_new(cls):
        uid = str(uuid.uuid1())  # This line is where all uids are generated

        return cls(uid, "Player %s" % uid[:4], 0, 0, is_new=True)


if __name__ == '__main__':
    db = PlayerIdentity.db

    for d in db:
        p = PlayerIdentity(**d)

        print p.uid.ljust(40), p.nickname.ljust(20).encode('utf-8'), p._num_played, p._num_won
