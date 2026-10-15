"""Business services. Services ``flush()`` but never ``commit()``; callers own the transaction.

Cross-agent calls use module imports (``from app.services import orders as orders_service``)."""
