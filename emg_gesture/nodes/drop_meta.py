from timeflux.core.node import Node

class DropMeta(Node):
    def update(self):
      self.o.data = self.i.data
      self.o.meta = None