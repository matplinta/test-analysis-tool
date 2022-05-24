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
from rep_portal.api import RepPortal
from datetime import date
from typing import Dict


class Analyzer():
    def __init__(self, fail_message_dict=None, filters=None, rp_token=None):
        self.rp_token = rp_token
        self.fail_message_dict = fail_message_dict if fail_message_dict else {}
        self.filters = filters if filters else {}
        self.limit = self.filters.pop('limit', 100)
    
    
    def get_data_from_rp(self, url=None):
        if url:
            df = self._get_normalized_json_from_url(url)
        else:
            datajson = RepPortal(self.rp_token).get_data_from_testruns(limit=self.limit, filters=self.filters)
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


    def _establishing_exception_type(self, msg):
        lines = msg.split('\n')
        for line in lines:
            for regexp in self.fail_message_dict.keys():
                if re.search(regexp, line):
                    return self.fail_message_dict[regexp]
        # print(msg)
        return lines[0]

    def _get_additional_info(self, df):
        earliest = min(df["end"])
        latest = max(df["end"])
        return f"Data range: {earliest} - {latest}"

    def _get_normalized_exception_data(self, df):
        df_temp = df.copy()
        df_temp['exception_type'] = df_temp.apply(lambda value: self._establishing_exception_type(value.fail_message), axis=1)
        df_temp.drop(['fail_message'], axis=1, inplace=True)
        return df_temp


    def _get_data_indexed_by_exception_type(self, df, date_start: date=None, date_end: date=None, time_column="end"):
        if date_start and date_end:
            df_filtered = df.loc[df[time_column].between(str(date_start), str(date_end))]
            label = f"between {date_start} - {date_end}"
        elif date_start and not date_end:
            df_filtered = df.loc[df[time_column] >= str(date_start)]
            label = f"after {date_start}"
        elif not date_start and date_end:
            df_filtered = df.loc[df[time_column] <= str(date_end)]
            label = f"before {date_end}"
        else:
            df_filtered = df
            label = "Occurrences"

        df_filtered = df_filtered.groupby(['exception_type']).count()['result'].reset_index()
        df_filtered = df_filtered.set_index('exception_type').rename(columns={'result': label})
        return df_filtered


    def merge_df_from_date_ranges(self, df_1, df_2):
        return pd.merge(df_1, df_2, how="outer", left_index=True, right_index=True).fillna(value=0).astype(int)


    def _prepare_data_for_frontend(self, df_merged, info=None) -> Dict:
        data = {"labels": df_merged.index.values.tolist()}
        for col in df_merged.columns:
            data[col] = df_merged[col].values.tolist()
        if info:
            data['info'] = info
        return data


    def _handle_matplotlib_params(self, df, size, figure_name="figure"):
        try:
            ax = df.plot.barh(figsize=(18,10))
            ax.text(10, 3, f"Number of total failed runs {size}")
            ax.legend(bbox_to_anchor=(1, 0.3), fontsize='14');
            for p in ax.patches:
                w = p.get_width()
                ax.annotate(f'{w:.2f}', (w * 0.5, p.get_y() + 0.1))
            plt.show()
            plt.rcParams["figure.figsize"] = [7.00, 3.50]
            plt.rcParams["figure.autolayout"] = True
            fig = ax.get_figure()
            plt.subplots_adjust(left=0.7, )
            fig.savefig(f'media/{figure_name}.png')
        except IndexError as e:
            print(str(e))

    def plot_runs_by_exception_types(self, df=None, plot=False, figure_name="figure"):
        if df is None:
            df = self.df
        size = len(df.index)
        df_temp = self._get_normalized_exception_data(df)
        info = self._get_additional_info(df_temp)
        df_temp = self._get_data_indexed_by_exception_type(df_temp)
        df_temp.sort_values(by=list(df_temp.columns), inplace=True)
        if plot:
            self._handle_matplotlib_params(df_temp, size, figure_name)
        return self._prepare_data_for_frontend(df_temp, info=info)


    def plot_runs_by_exception_types_by_date_ranges(
            self, 
            date_middle: date,
            date_start: date=None,
            date_end: date=None,
            df=None, 
            plot=False, 
            figure_name="figure"
        ):
        if df is None:
            df = self.df
        size = len(df.index)
        df_temp = self._get_normalized_exception_data(df)
        info = self._get_additional_info(df_temp)
        if date_middle and date_start and date_end:
            df_before = self._get_data_indexed_by_exception_type(df_temp, date_start=date_start, date_end=date_middle)
            df_after = self._get_data_indexed_by_exception_type(df_temp,  date_start=date_middle, date_end=date_end)
        elif not date_start and not date_end:
            df_before = self._get_data_indexed_by_exception_type(df_temp, date_end=date_middle)
            df_after = self._get_data_indexed_by_exception_type(df_temp,  date_start=date_middle)
        else:
            raise ArgumentError(message="Unhandled parameter combination. Specify all dates (start, middle, end) or only middle!")
        
        df_merged = self.merge_df_from_date_ranges(df_before, df_after)

        df_merged.sort_values(by=list(df_merged.columns), inplace=True)
        if plot:
            self._handle_matplotlib_params(df_merged, size, figure_name)
        return self._prepare_data_for_frontend(df_merged, info=info)
    


if __name__ == "__main__":
    pass
