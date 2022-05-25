import { BehaviorSubject } from 'rxjs';
import { toast, Zoom } from 'react-toastify';

const notifications = new BehaviorSubject(null);

class NotificationService {
    notifications = notifications.asObservable();
    configuration = {
        position: toast.POSITION.TOP_RIGHT,
        transition: Zoom,
        theme: 'colored'
    }

    sendNotification = (message, type) => {
        try {
            if (message) {
                const msg = message instanceof String ? message : message.toString();

                switch (type) {
                    case AlertTypes.success:
                        notifications.next(() => toast.success(msg, this.configuration));
                        break;
                    case AlertTypes.info:
                        notifications.next(() => toast.info(msg, this.configuration));
                        break;
                    case AlertTypes.warn:
                        notifications.next(() => toast.warn(msg, this.configuration));
                        break;
                    case AlertTypes.error:
                        notifications.next(() => toast.error(msg, this.configuration));
                        break;
                    default:
                        notifications.next(() => toast(msg, this.configuration));
                        break;
                }
            }
        } catch (ex) {
            notifications.next(() => toast.error(ex.message, this.configuration));
        }
        notifications.next(null);
    }
}

const Notify = new NotificationService();

export default Notify;

export const AlertTypes = Object.freeze({
    success: Symbol('success'),
    info: Symbol('info'),
    warn: Symbol('warn'),
    error: Symbol('error')
});

export const Successes = {
    'ADD_GLOBAL_FILTER_SUCCESS': 'Global filter added successfully!',
    'REMOVE_GLOBAL_FILTER_SUCCESS': 'Global filter removed successfully!',
    'ADD_TEST_SET_SUCCESS': 'Test set added successfully!'
}

export const Errors = {
    'REMOVE_GLOBAL_FILTER_ERROR': 'Error during global filter removing!',
    'ADD_TEST_SET_ERROR': 'Test set added failed!',
    'GET_TEST_RUNS': "Cannot get test runs!",
    'GET_TEST_RUNS_FILTERS': "Cannot get test runs filters!"
}

export const Warnings = {
    'RP_URL_No_RUN_SELECTED': 'No runs were selected in test run table!!'
}

export const Infos = {
    'RP_URL_COPIED': 'Generated RP URL was copied to clipboard!'
}