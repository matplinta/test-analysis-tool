#!/usr/bin/env python3

"""
:author: Mateusz Plinta
:contact: mateusz.plinta@.com
:description: 
"""

import pandas as pd
import requests
import json
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from pandas import json_normalize
import re




exception_dict = {
    r'NoRegexpMatch:.*after 10 secs to match regexp \(.*\) in output': "EGATE print did not match",
    r'MibSibAcquisitionFailed': "MIB-SIB Acquisition Failed",
    r'RadioHeadTimeoutException': "RadioHeadTimeoutException",
    r'ParsingFailed:.*syslog': "Cannot find print in syslog",
    r'AdminApiProcedureFailureException': "Admin API exception",
    r'Number of messages \d+ is not.*': "Cannot find print in syslog",
    r'It was not possible to find string.*Established PDU session': "PDU session setup failure",
    r'It was not possible to find string.*Received REGISTRATION COMPLETE': "UE register failure",
    r'UnboundLocalError: local variable.*admin_connection.*referenced before assignment': "Admin API exception",
    r'Value for period \d+ is \d+ but expected is': "PM Counter error",
    r'CounterNotFound': "PM Counter error",
    r'MessageObserverTimeout': "PCAP validation failed",
    r'NoRegexpMatch: Fail regexp found \(.*handover.*performed.*\)': "Handover performed while it should not have been",
    r'No keyword with name': "Test script error",
    r'NoValidConnectionsError:.*192.168.255.1': "Connection to gNB was lost",
    r'AdminApi.*Exception': "Admin API exception",
    r'DTX ratio.*is to.*high': "DTX ratio is to high",
    r'.*is present in SCF. This is unexpected': "Object in SCF is present, while it should not be",
    r'.*is present in SCF, while it should not be': "Object in SCF is present, while it should not be",
    r'.*is not present in SCF': "Object is missing from SCF",
    r'.*not found in gNB tcpdump file': "PCAP validation failed",
    r'Counter.*does not satisfy the expression': "PM Counter error",
    r'NoMessageInFlow:.*': "PCAP validation failed",
}

def establishing_exception_type(msg):
        lines = msg.split('\n')
        for line in lines:
            for regexp in exception_dict.keys():
                if re.search(regexp, line):
                    return exception_dict[regexp]
        print(msg)
        return lines[0]

def get_normalized_exception_data(df):
    df_temp = df.copy()
    df_temp['exception_type'] = df_temp.apply(lambda value: establishing_exception_type(value.fail_message), axis=1)
    return df_temp

def plot_runs_by_exception_types(df):
    size = len(df.index)
    df_temp = get_normalized_exception_data(df)
    df_temp.drop(['fail_message'], axis=1, inplace=True)
    df_temp = df_temp.groupby(['exception_type']).count()['result'].reset_index()
    
    df_temp.sort_values(by=["result"], inplace=True, ignore_index=True)
    ax = df_temp.plot.barh(x="exception_type", figsize=(10,8))
    ax.text(10, 3, f"Number of total failed runs {size}")
    ax.legend(bbox_to_anchor=(1, 0.3), fontsize='14');
    for p in ax.patches:
        w = p.get_width()
        ax.annotate(f'{w:.2f}', (w * 0.5, p.get_y() + 0.1))
    fig = ax.get_figure()
    fig.savefig('figure.png')  
#     display(df_temp)
    
    
def get_normalized_json_from_url(url):
    response = requests.get(url)
    resp_dict = response.json()
    recs = resp_dict['results']
    df = json_normalize(recs)
    return df



if __name__ == "__main__":
    # url = 'http://rep-portal.wroclaw.nsn-rdnet.net/api/automatic-test/runs/report/powerbi.1646230408210.json?limit=5000&builds__name__pos_neg=SBTS00%2CSBTS22R1%2CSBTS22R2&ordering=-start&qc_test_instance__test_set__name__pos_neg=2175-RB%2C%202175-QB%2C%201085-A%2C%201085-B%2C%201085-C%2C%207883%2C%202640_AD_DRX_MG%2C%205GC002640_B_Multi_UE_support&qc_test_instance__test_object__pos_neg=Regression&test_case__name__name__pos_neg=2175-RB%2C%202175-QB%2C%201085%2C%207883%2C%202640&fields=no,qc_test_set,test_case__name,hyperlink_set__test_logs_url,test_col__name,start,result,test_line,test_col__testline_type,builds,test_col__ute_version,qc_test_instance__organization,qc_test_instance__test_object,qc_test_instance__feature,test_setup_exception,test_setup_exception_message,test_exception,test_exception_message,test_teardown_exception,test_teardown_exception_message,fail_message&powerBIToken=fbe23d8dc34fb99d08fd12de71b5ab0c6fd90afb'
    url = 'http://rep-portal.wroclaw.nsn-rdnet.net/api/automatic-test/runs/report/powerbi.1646299165157.json?limit=3000&builds__name__pos_neg=SBTS00%2CSBTS22R1%2CSBTS22R2&ordering=-start&qc_test_instance__test_set__name__pos_neg=2175-RB%2C%202175-QB%2C%201085-A%2C%201085-B%2C%201085-C%2C%207883%2C%202640_AD_DRX_MG%2C%205GC002640_B_Multi_UE_support&qc_test_instance__test_object__pos_neg=Regression&test_case__name__name__pos_neg=2175-RB%2C%202175-QB%2C%201085%2C%207883%2C%202640&result__name__pos_neg=not%20analyzed%2C%20env&fields=no,qc_test_set,test_case__name,hyperlink_set__test_logs_url,test_col__name,start,result,test_line,test_col__testline_type,builds,test_col__ute_version,qc_test_instance__organization,qc_test_instance__test_object,qc_test_instance__feature,test_setup_exception,test_setup_exception_message,test_exception,test_exception_message,test_teardown_exception,test_teardown_exception_message,fail_message&powerBIToken=fbe23d8dc34fb99d08fd12de71b5ab0c6fd90afb'
    df = get_normalized_json_from_url(url)

    # with open("data.json") as json_file:
    #     records = json.load(json_file)['results']
    #     df = json_normalize(records)

    df_failed = df[(df['fail_message'] != '') & (df['fail_message'].notnull())]
    # df_failed = df[df['fail_message'].notnull()]
    # display(df_failed)
    plot_runs_by_exception_types(df_failed)
    # df_na.groupby(['test_exception']).count()
    # df_na.groupby([df_na.index, 'test_exception']).count()['result']
    # df_temp = df.groupby(['fail_message']).count()['result'].reset_index()
    # df_temp2 = df.groupby(['test_setup_exception', 'test_exception', 'test_teardown_exception']).count()['result'].reset_index()

    # df_sample = df_na.iloc[:3]


    # display(df_temp2)
    # df_temp.plot.barh(x="fail_message")