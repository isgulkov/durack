import uuid


class PlayerIdentity:
    # TODO: store in a persistent database
    all_identities = {}

    def __init__(self, uid):
        self._uid = uid
        self.nickname = 'Player %s' % (uid[:4])

    def __eq__(self, other):
        return self._uid == other._uid

    def __hash__(self):
        return hash(self._uid)

    @property
    def uid(self):
        return self._uid

    @classmethod
    def from_uid(cls, uid):
        if uid in cls.all_identities:
            return cls.all_identities[uid]
        else:
            return None

    @classmethod
    def create_random(cls):
        uid = str(uuid.uuid1())  # This line is where all uids are generated

        cls.all_identities[uid] = PlayerIdentity(uid)

        return cls.all_identities[uid]

    def __str__(self):
        return repr(self)

    def __repr__(self):
        return "<PlayerID %s, %s>" % (self.uid, self.nickname.encode('utf-8'),)
