from celery.utils.log import get_task_logger
from celery import shared_task
from celery.schedules import crontab
from backend.celery import app
from .models import *

logger = get_task_logger(__name__)


@app.on_after_finalize.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(10.0, test.s('hello AWD AWD AWD AWD'), name='add every 10')
    # Call every 2 hours 52 min.
    # sender.add_periodic_task(
    #     crontab(minute=52, hour="*/2"),
    #     test.s("world")
    # )


@app.task
def test(arg):
    print(arg)



@shared_task(name="pull_tcs")
def pull_tcs():

    logger.info("Add fail message type to db")
    obj = FailMessageType(author=User.objects.get(id=1), 
                          name="awd", 
                          regex="awd", env_issue_type=EnvIssueType.objects.get(name="iphy padl"))
    obj.save()
    # return send_feedback_email(email, message)
