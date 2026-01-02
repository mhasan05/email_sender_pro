import asyncio
import logging
from aiosmtpd.controller import Controller
from aiosmtpd.handlers import AsyncMessage

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CustomHandler(AsyncMessage):
    async def handle_message(self, message):
        logger.info(f"Received message from: {message['From']}")
        logger.info(f"To: {message['To']}")
        logger.info(f"Subject: {message['Subject']}")
        # In a real system, we would parse this and store it in the database
        # or forward it.
        # Check for DKIM/SPF headers here.
        return '250 OK'

if __name__ == '__main__':
    handler = CustomHandler()
    controller = Controller(handler, hostname='0.0.0.0', port=8025)
    controller.start()
    logger.info("SMTP Server started on port 8025")
    
    try:
        asyncio.get_event_loop().run_forever()
    except KeyboardInterrupt:
        pass
    finally:
        controller.stop()
