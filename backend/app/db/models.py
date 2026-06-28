from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, func
from sqlalchemy.orm import relationship
from app.db.database import Base

class Collection(Base):
    __tablename__ = "collections"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    parent_id = Column(Integer, ForeignKey("collections.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Self-referencing relationship for folders
    children = relationship("Collection", back_populates="parent", cascade="all, delete-orphan")
    parent = relationship("Collection", back_populates="children", remote_side=[id])
    requests = relationship("Request", back_populates="collection", cascade="all, delete-orphan")

class Request(Base):
    __tablename__ = "requests"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    collection_id = Column(Integer, ForeignKey("collections.id", ondelete="CASCADE"), nullable=True)
    name = Column(String, nullable=False)
    method = Column(String, nullable=False, default="GET")
    url = Column(String, nullable=False, default="")
    headers = Column(String, nullable=False, default="[]") # JSON stringified
    query_params = Column(String, nullable=False, default="[]") # JSON stringified
    body_type = Column(String, nullable=False, default="none") # none, raw, form-data, x-www-form-urlencoded
    body_content = Column(String, nullable=True)
    auth_type = Column(String, nullable=False, default="none") # none, basic, bearer
    auth_config = Column(String, nullable=True) # JSON stringified
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    collection = relationship("Collection", back_populates="requests")

class History(Base):
    __tablename__ = "history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=True)
    method = Column(String, nullable=False)
    url = Column(String, nullable=False)
    headers = Column(String, nullable=False, default="[]") # JSON stringified
    query_params = Column(String, nullable=False, default="[]") # JSON stringified
    body_type = Column(String, nullable=False, default="none")
    body_content = Column(String, nullable=True)
    auth_type = Column(String, nullable=False, default="none")
    auth_config = Column(String, nullable=True)
    
    # Response statistics
    response_status = Column(Integer, nullable=False)
    response_time_ms = Column(Integer, nullable=False)
    response_size_bytes = Column(Integer, nullable=False)
    response_headers = Column(String, nullable=True) # JSON stringified
    response_body = Column(String, nullable=True)
    sent_at = Column(DateTime, default=func.now())

class Environment(Base):
    __tablename__ = "environments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False, unique=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    variables = relationship("Variable", back_populates="environment", cascade="all, delete-orphan")

class Variable(Base):
    __tablename__ = "variables"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    environment_id = Column(Integer, ForeignKey("environments.id", ondelete="CASCADE"), nullable=True) # NULL means Global
    key = Column(String, nullable=False)
    value = Column(String, nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    environment = relationship("Environment", back_populates="variables")

class Tab(Base):
    __tablename__ = "tabs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    request_id = Column(Integer, ForeignKey("requests.id", ondelete="SET NULL"), nullable=True)
    name = Column(String, nullable=False)
    method = Column(String, nullable=False, default="GET")
    url = Column(String, nullable=False, default="")
    headers = Column(String, nullable=False, default="[]") # JSON string
    query_params = Column(String, nullable=False, default="[]") # JSON string
    body_type = Column(String, nullable=False, default="none")
    body_content = Column(String, nullable=True)
    auth_type = Column(String, nullable=False, default="none")
    auth_config = Column(String, nullable=True)
    is_dirty = Column(Boolean, default=False)
    position = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
