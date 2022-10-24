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

    configurationLonger = {
        position: toast.POSITION.TOP_RIGHT,
        transition: Zoom,
        theme: 'colored',
        autoClose: 6000
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
                        notifications.next(() => toast.info(msg, this.configurationLonger));
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
    'LOGIN': 'User was logged in successfully',
    'ADD_TEST_SET_FILTER': 'Test Set Filter added successfully!',
    'EDIT_TEST_SET_FILTER': 'Test Set Filter edited successfully!',
    'REMOVE_GLOBAL_FILTER_SUCCESS': 'Global filter removed successfully!',
    'TEST_SET_FILTERS_SUBSCRIBED': 'Test set filters were subscribed successfully!',
    'TEST_SET_FILTERS_UNSUBSCRIBED': 'Test set filters were unsubscribed successfully!',
    'TEST_SET_FILTER_SUBSCRIBED': 'Test set filter was unsubscribed successfully!',
    'TEST_SET_FILTER_UNSUBSCRIBED': 'Test set filter were unsubscribed successfully!',
    'TEST_SET_FILTER_DELETED': 'Test set filter was removed successfully!',
    'TEST_SET_FILTER_EDITED': 'Test set filter was edited successfully!',
    'BRANCH_OFF': 'Branch Off performed successfully!',
    'EDIT_FAIL_MESSAGE_REGEX': 'Fail Message Regex edited successfully!',
    'ADD_FAIL_MESSAGE_REGEX': 'Fail Message Regex added successfully!',
    'REMOVE_FAIL_MESSAGE_REGEX': 'Fail Message Regex removed successfully!',
    'REMOVE_FAIL_MESSAGE_REGEX_GROUP': 'Fail Message Regex Group removed successfully!',
    'ADD_FAIL_MESSAGE_REGEX_GROUP': 'Fail Message Regex Group created successfully!',
    'EDIT_FAIL_MESSAGE_REGEX_GROUP': 'Fail Message Regex Group edited successfully!',
    'ANALYSE_TEST_RUN': 'Test runs were analyzed successfully!',
    'ADD_FILTER_SET': 'Filter set was added successfully!',
    'DOWNLOAD_EXCEL': 'Excel report was downloaded successfully!'
}

export const Errors = {
    'LOGIN': 'Error during user login!',
    'LOGOUT': 'Error during user logout!',
    'REMOVE_GLOBAL_FILTER_ERROR': 'Error during global filter removing!',
    'ADD_TEST_SET_FILTER': 'Error during Test Set filter add!',
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
    'GET_TEST_SET_FILTER': 'Test set filters were not loaded successfully!',
    'GET_BRANCHES': 'Error during fetching branches!',
    'BRANCH_OFF': 'Error during peerforming Branch Off!',
    'FETCH_USERS_LIST': 'Error during users fetching!',
    'FETCH_FAIL_MESSAGE_GROUPS_LIST': 'Error during Fail Messages Type Groups fetching!',
    'FETCH_TEST_LINES_LIST': 'Error during Test Lines Types fetching!',
    'EDIT_FAIL_MESSAGE_REGEX': 'Error during Fail Message Regex editing!',
    'ADD_FAIL_MESSAGE_REGEX': 'Error during Fail Message Regex adding!',
    'REMOVE_FAIL_MESSAGE_REGEX': 'Error during Fail Message Regex removing!',
    'FETCH_FAIL_MESSAGE_REGEX': 'Error during Fail Message Regex fetching!',
    'FETCH_FAIL_MESSAGE_REGEX_GROUP': 'Error during fetching Fail Message Regex Groups!',
    'REMOVE_FAIL_MESSAGE_REGEX_GROUP': 'Error during Fail Message Regex Group removing!',
    'ADD_FAIL_MESSAGE_REGEX_GROUP': 'Error during Fail Message Regex Group creating!',
    'EDIT_FAIL_MESSAGE_REGEX_GROUP': 'Error during Fail Message Regex Group editing!',
    'FETCH_SUMMARY': 'Error during fetching summary for the latest feature build!',
    'FETCH_TEST_INSTANCES': 'Error during fetching test instances!',
    'FETCH_TEST_SET_FILTERS_BRANCHED': 'Error during fetching test set filters for selected branch!',
    'FETCH_TEST_SET_FILTERS': 'Error during fetching test set filters!',
    'DELETE_TEST_SET_FILTERS': 'Error during removing test set filters!',
    'FETCH_ENV_ISSUE_TYPES': 'Error during fetching environment issue types!',
    'ANALYSE_TEST_RUN': 'Error during setting test run as environment issue!',
    'ADD_FILTER_SET': 'Error during Filter Set adding!',
    'FETCH_USER_MESSAGES': 'Error during fetching user\' messages!',
    'DELETE_USER_MESSAGE': 'Error during deleting user\' message!',
    'UPDATE_USER_MESSAGE': 'Error during updating of user\'s message!',
    'DOWNLOAD_EXCEL': 'Error during excel generating!',
    'FETCH_FILTER_SETS': 'Error during Filter Sets fetching!'

}

export const Warnings = {
    'RP_URL_No_RUN_SELECTED': 'No runs were selected in test run table!',
    'BRANCH_OFF': 'Please select new branch!',
    'EDIT_TEST_SET_FILTER_ANY_OWNER': 'There must be at least one owner for Test Set Filter'
}

export const Infos = {
    'RP_URL_COPIED': 'Generated RP URL was copied to clipboard!',
    'DOWNLOAD_EXCEL': 'Generating report may take some time, please wait for result, data is loaded. After that excel file with report will be downloaded to your computer!'
}