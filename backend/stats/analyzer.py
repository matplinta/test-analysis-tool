#!/usr/bin/env python3

"""
:author: Mateusz Plinta
:contact: mateusz.plinta@.com
:description: 
"""

from argparse import ArgumentError
import pandas as pd
import requests
import json
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from pandas import json_normalize
import re
from io import BytesIO
from rep_portal.api import RepPortal
from datetime import date
from typing import Dict, Tuple
from tra.utils import get_rp_api_auth_params


class Analyzer():
    def __init__(self, fail_message_dict=None, filters=None, rp_auth_params=None):
        if not rp_auth_params:
            rp_auth_params = get_rp_api_auth_params()
        self.rp_auth_params = rp_auth_params
        self.fail_message_dict = fail_message_dict if fail_message_dict else {}
        self.filters = filters if filters else {}
        self.limit = self.filters.pop('limit', 1000)
    
    
    def get_data_from_rp(self, url=None):
        if url:
            df = self._get_normalized_json_from_url(url)
        else:
            datajson, _ = RepPortal(**self.rp_auth_params).get_data_from_testruns(limit=self.limit, filters=self.filters)
            df = json_normalize(datajson)
        df = self._drop_empty_fail_msg_rows(df)
        df = self._convert_datetime_columns_to_datetime(df)
        self.df = df
        return self.df
    

    def _drop_empty_fail_msg_rows(self, df):
        return df[(df['fail_message'] != '') & (df['fail_message'].notnull())]
    
    
    def _convert_datetime_columns_to_datetime(self, df):
        df['start'] = pd.to_datetime(df['start'])
        df['end'] = pd.to_datetime(df['end'])
        return df
    

    def _get_normalized_json_from_url(self, url):
        response = requests.get(url)
        return json_normalize(response.json()['results'])


    def _establish_exception_type(self, msg):
        lines = msg.split('\n')
        for line in lines:
            for regexp in self.fail_message_dict.keys():
                if re.search(regexp, line):
                    return self.fail_message_dict[regexp]
        return lines[0]

    def get_data_dates_range_info(self, df) -> Tuple[str, str]:
        earliest = min(df["end"])
        latest = max(df["end"])
        return earliest, latest


    def add_normalized_exception_data_column(self, df=None):
        if df is None:
            df = self.df
        df_temp = df.copy()
        df_temp['exception_type'] = df_temp.apply(lambda value: self._establish_exception_type(value.fail_message), axis=1)
        self.df = df_temp
        return df_temp

    def get_data_filtered_by_date_ranges(self, date_start: date=None, date_end: date=None, df=None, time_column="end") -> pd.DataFrame:
        if df is None:
            df = self.df
        if date_start and date_end:
            df_filtered = df.loc[df[time_column].between(str(date_start), str(date_end))]
        elif date_start and not date_end:
            df_filtered = df.loc[df[time_column] >= str(date_start)]
        elif not date_start and date_end:
            df_filtered = df.loc[df[time_column] <= str(date_end)]
        else:
            df_filtered = df
        self.df = df_filtered
        return df_filtered


    def get_data_indexed_by_exception_type(self, df, label="Occurrences"):
        df = df.groupby(['exception_type']).count()['result'].reset_index()
        df = df.set_index('exception_type').rename(columns={'result': label})
        return df

    def get_chart_data_indexed_by_exception_type(self, df=None):
        if df is None:
            df = self.df
        def parse_data_to_dict(df_temp, info=None) -> Dict:
            data = {"labels": df_temp.index.values.tolist()}
            for col in df_temp.columns:
                data[col] = df_temp[col].values.tolist()
            if info:
                data['info'] = info
            return data

        size = len(df.index)
        print(size)
        earliest_record, oldest_record = self.get_data_dates_range_info(df)
        df_temp = self.add_normalized_exception_data_column(df)
        df_temp = self.get_data_indexed_by_exception_type(df_temp)
        df_temp.sort_values(by=list(df_temp.columns), inplace=True)
        return parse_data_to_dict(df_temp, info=f"Records: {size}; From {earliest_record} to {oldest_record}")


    def get_excel_file_binary_data_from_dataframe(self, df=None):
        if df is None:
            df = self.df
        in_memory_excell = BytesIO()
        df.to_excel(in_memory_excell, index=False)
        return in_memory_excell.getvalue()