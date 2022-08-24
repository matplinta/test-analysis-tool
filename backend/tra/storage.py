from django.core.files.storage import Storage
from django.conf import settings
from django.utils import timezone
from datetime import datetime
from urllib.parse import urlparse
import subprocess
import os
import shutil

class UTECloudLogsStorage(Storage):
    def __init__(self, storage_local_path=None, storage_http_server=None):
        if not storage_local_path:
            storage_local_path = settings.LOGS_STORAGE_PATH
        if not storage_http_server:
            storage_http_server = settings.LOGS_STORAGE_HTTP_SERVER

        self._storage_local_path  = storage_local_path
        self._storage_http_server = storage_http_server


    def path(self, name):
        return os.path.join(self._storage_local_path, name)

    def _save(self, directory, url, timeout):
        path = self.path(directory)
        url_path = urlparse(url).path
        if url_path.endswith('/'):
            url_path = url_path[:-1]
        cut_dirs = url_path.count('/')
        wget_cmd = f"wget -r -np -nH --cut-dirs={cut_dirs} -R index.html -R index.html.tmp {url}"
        os.makedirs(path, exist_ok=True)
        proc = subprocess.Popen(wget_cmd, shell=True, stdout=subprocess.PIPE, cwd=path)
        # try:
        #     outs, errs = proc.communicate(timeout=300)
        # except subprocess.TimeoutExpired:
        #     proc.kill()
        #     outs, errs = proc.communicate()
        proc.communicate(timeout=timeout)
        return True if proc.returncode == 0 else False 

    
    def save(self, name, url, max_length=None, timeout=900):
        name = self.get_available_name(name, max_length=max_length)
        is_saved = self._save(name, url, timeout)
        return is_saved


    def delete(self, name):
        """
        Delete the specified directory from the storage system.
        """
        if not name:
            raise ValueError("The name must be given to delete().")
        name = self.path(name)
        # If the file or directory exists, delete it from the filesystem.
        try:
            if os.path.isdir(name):
                shutil.rmtree(name)
            else:
                os.remove(name)
        except FileNotFoundError:
            # FileNotFoundError is raised if the file or directory was removed
            # concurrently.
            pass
        except OSError as e:
            pass


    def exists(self, name):
        """
        Return True if a directory referenced by the given name already exists in the
        storage system, or False if the name is available for a new directory.
        """
        return os.path.isdir(self.path(name))


    def listdir(self, path):
        """
        List the contents of the specified path. Return a 2-tuple of lists:
        the first item being directories, the second item being files.
        """
        current, dirs, files = next(os.walk(self.path(path)))
        return dirs, files


    def size(self, name):
        """
        Return the total size, in bytes, of the file specified by name.
        """
        def get_dir_size(path):
            total = 0
            with os.scandir(path) as it:
                for entry in it:
                    if entry.is_file():
                        total += entry.stat().st_size
                    elif entry.is_dir():
                        total += get_dir_size(entry.path)
            return total

        return get_dir_size(self.path(name))


    def url(self, name):
        """
        Return an absolute URL where the file's contents can be accessed
        directly by a web browser.
        """
        return f"{self._storage_http_server}/{name}"

    def _datetime_from_timestamp(self, ts):
        """
        If timezone support is enabled, make an aware datetime object in UTC;
        otherwise make a naive one in the local timezone.
        """
        tz = timezone.utc if settings.USE_TZ else None
        return datetime.fromtimestamp(ts, tz=tz)

    def get_accessed_time(self, name):
        return self._datetime_from_timestamp(os.path.getatime(self.path(name)))

    def get_created_time(self, name):
        return self._datetime_from_timestamp(os.path.getctime(self.path(name)))

    def get_modified_time(self, name):
        return self._datetime_from_timestamp(os.path.getmtime(self.path(name)))
    