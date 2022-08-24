from django.core.files.storage import Storage
from django.conf import settings
import subprocess
import os

class UTECloudLogsStorage(Storage):
    def __init__(self, storage_local_path=None, storage_http_server=None):
        if not storage_local_path:
            storage_local_path = settings.LOGS_STORAGE_PATH
        if not storage_http_server:
            storage_http_server = settings.LOGS_STORAGE_HTTP_SERVER

        self._storage_local_path  = storage_local_path
        self._storage_http_server = storage_http_server


    def _save(self, directory, url):
        cwd = self._storage_local_path
        path = os.path.join(cwd, directory)
        wget_cmd = f"wget -r -np -nH --cut-dirs=3 -R index.html -R index.html.tmp {url}"
        os.makedirs(path, exist_ok=True)
        proc = subprocess.Popen(wget_cmd, shell=True, stdout=subprocess.PIPE, cwd=path)
        # try:
        #     outs, errs = proc.communicate(timeout=300)
        # except subprocess.TimeoutExpired:
        #     proc.kill()
        #     outs, errs = proc.communicate()
        proc.communicate(timeout=300)
        return True if proc.returncode == 0 else False 

    
    def save(self, name, content, max_length=None):
        name = self.get_available_name(name, max_length=max_length)
        name = self._save(name, content)
        # Ensure that the name returned from the storage system is still valid.
        validate_file_name(name, allow_relative_path=True)
        return name


    def delete(self, name):
        """
        Delete the specified file from the storage system.
        """
        raise NotImplementedError(
            "subclasses of Storage must provide a delete() method"
        )

    def exists(self, name):
        """
        Return True if a file referenced by the given name already exists in the
        storage system, or False if the name is available for a new file.
        """
        raise NotImplementedError(
            "subclasses of Storage must provide an exists() method"
        )

    def listdir(self, path):
        """
        List the contents of the specified path. Return a 2-tuple of lists:
        the first item being directories, the second item being files.
        """
        raise NotImplementedError(
            "subclasses of Storage must provide a listdir() method"
        )

    def size(self, name):
        """
        Return the total size, in bytes, of the file specified by name.
        """
        raise NotImplementedError("subclasses of Storage must provide a size() method")

    def url(self, name):
        """
        Return an absolute URL where the file's contents can be accessed
        directly by a web browser.
        """
        raise NotImplementedError("subclasses of Storage must provide a url() method")

    def get_accessed_time(self, name):
        """
        Return the last accessed time (as a datetime) of the file specified by
        name. The datetime will be timezone-aware if USE_TZ=True.
        """
        raise NotImplementedError(
            "subclasses of Storage must provide a get_accessed_time() method"
        )

    def get_created_time(self, name):
        """
        Return the creation time (as a datetime) of the file specified by name.
        The datetime will be timezone-aware if USE_TZ=True.
        """
        raise NotImplementedError(
            "subclasses of Storage must provide a get_created_time() method"
        )

    def get_modified_time(self, name):
        """
        Return the last modified time (as a datetime) of the file specified by
        name. The datetime will be timezone-aware if USE_TZ=True.
        """
        raise NotImplementedError(
            "subclasses of Storage must provide a get_modified_time() method"
        )

    