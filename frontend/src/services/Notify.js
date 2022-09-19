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
    'ADD_TEST_SET_FILTER': 'Test Set Filter added successfully!',
    'EDIT_TEST_SET_FILTER': 'Test Set Filter edited successfully!',
    'REMOVE_GLOBAL_FILTER_SUCCESS': 'Global filter removed successfully!',
    'TEST_SET_FILTERS_SUBSCRIBED': 'Test set filters were subscribed successfully!',
    'TEST_SET_FILTERS_UNSUBSCRIBED': 'Test set filters were unsubscribed successfully!',
    'TEST_SET_FILTER_SUBSCRIBED': 'Test set filter was unsubscribed successfully!',
    'TEST_SET_FILTER_UNSUBSCRIBED': 'Test set filter were unsubscribed successfully!',
    'TEST_SET_FILTER_DELETED': 'Test set filter was removed successfully!',
    'TEST_SET_FILTER_EDITED': 'Test set filter was edited successfully!',
    'BRANCH_OFF': 'Branch Off performed succesfully!',
    'EDIT_FAIL_MESSAGE_REGEX': 'Fail Message Regex edited succesfully!',
    'ADD_FAIL_MESSAGE_REGEX': 'Fail Message Regex added succesfully!',
    'REMOVE_FAIL_MESSAGE_REGEX': 'Fail Message Regex removed succesfully!',
    'REMOVE_FAIL_MESSAGE_REGEX_GROUP': 'Fail Message Regex Group removed succesfully!'

}

export const Errors = {
    'REMOVE_GLOBAL_FILTER_ERROR': 'Error during global filter removing!',
    'ADD_TEST_SET_FILTER': 'Error during Test Sert filter add!',
    'EDIT_TEST_SET_FILTER': 'Error during Test Set filter edit!',
    'FETCH_EDIT_TEST_SET_FILTER': 'Error during fetching Test Set Filter to edit!',
    'GET_TEST_RUNS': "Cannot get test runs!",
    'GET_TEST_RUNS_FILTERS': "Cannot get test runs filters!",
    'EMPTY_FIELDS': "Cannot send due to empty fields. Please fulfil form.",
    'TEST_SET_FILTERS_SUBSCRIBED': 'Test set filters were not subscribed!',
    'TEST_SET_FILTERS_UNSUBSCRIBED': 'Test set filters were not subscribed!',
    'TEST_SET_FILTER_SUBSCRIBED': 'Test set filter were not subscribed!',
    'TEST_SET_FILTER_UNSUBSCRIBED': 'Test set filter was not unsubscribed!',
    'TEST_SET_FILTERS_DELETED': 'Test set filters were not removed!',
    'TEST_SET_FILTER_EDITED': 'Test set filter was not edited!',
    'GET_BRANCHES': 'Error during fetching branches!',
    'BRANCH_OFF': 'Error during pewrforming Branch Off!',
    'FETCH_USERS_LIST': 'Error during users fetching!',
    'FETCH_FAIL_MESSAGE_GROUPS_LIST': 'Error during Fail Messages Type Groups fetching!',
    'FETCH_TEST_LINES_LIST': 'Error during Test Lines Types fetching!',
    'EDIT_FAIL_MESSAGE_REGEX': 'Error during Fail Message Regex editing!',
    'ADD_FAIL_MESSAGE_REGEX': 'Error during Fail Message Regex adding!',
    'REMOVE_FAIL_MESSAGE_REGEX': 'Error during Fail Message Regex removing!',
    'FETCH_FAIL_MESSAGE_REGEX': 'Error during Fail Message Regex fetching!',
    'REMOVE_FAIL_MESSAGE_REGEX_GROUP': 'Error during Fail Message Regex Group removing!',


}

export const Warnings = {
    'RP_URL_No_RUN_SELECTED': 'No runs were selected in test run table!!',
    'BRANCH_OFF': 'Please select new branch!',
    'EDIT_TEST_SET_FILTER_ANY_OWNER': 'There must be at least one owner for Test Set Filter'
}

export const Infos = {
    'RP_URL_COPIED': 'Generated RP URL was copied to clipboard!'
}