from django.shortcuts import render


def load_index(request):
    return render(request, 'index.html', {})
