from sqlalchemy.orm import Session


class DistanceRepository:
    def __init__(self, session: Session):
        self.session = session
