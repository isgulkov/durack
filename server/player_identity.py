import uuid

from tinydb import TinyDB, Query


class PlayerIdentity(object):
    db = TinyDB('db.json')

    currently_loaded = set()

    def __init__(self, uid, nickname, num_played, num_won, is_new=False):
        self._uid = uid
        self._nickname = nickname
        self._num_played = num_played
        self._num_won = num_won

        if is_new:
            self.db.insert(self.as_dict())

        self.currently_loaded.add(uid)

    def __eq__(self, other):
        return self._uid == other._uid

    def __hash__(self):
        return hash(self._uid)

    def __str__(self):
        return repr(self)

    def __repr__(self):
        return "<PlayerID {}, {}, {} played, {} won>".format(
            self.uid,
            self._nickname.encode('utf-8'),
            self._num_played, self._num_won
        )

    def __del__(self):
        self.currently_loaded.remove(self._uid)

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

    def count_win(self):
        self._num_played += 1
        self._num_won += 1

        self._dump()

    def count_loss(self):
        self._num_played += 1

        self._dump()

    @classmethod
    def from_uid(cls, uid):
        if uid in cls.currently_loaded:
            # Don't load one identity twice, i.e. for two different players
            return None

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
