from django.utils.deprecation import MiddlewareMixin
from django.urls import reverse
from django.shortcuts import redirect


class LoginCheckMiddleWare(MiddlewareMixin):
    def process_view(self, request, view_func, view_args, view_kwargs):
        modulename = view_func.__module__
        user = request.user # Who is the current user ?
        if user.is_authenticated:
            if user.user_type == '1': # Is it the HOD/Admin
                if modulename == 'main_app.student_views':
                    return redirect(reverse('admin_home'))
            elif user.user_type == '2': #  Staff :-/ ?
                if modulename == 'main_app.student_views' or modulename == 'main_app.hod_views':
                    return redirect(reverse('staff_home'))
            elif user.user_type == '3': # ... or Student ?
                if modulename == 'main_app.hod_views' or modulename == 'main_app.staff_views':
                    return redirect(reverse('student_home'))
            else: # None of the aforementioned ? Please take the user to login page
                return redirect(reverse('login_page'))
        else:
            if request.path == reverse('login_page') or modulename == 'django.contrib.auth.views' or request.path == reverse('user_login'): # If the path is login or has anything to do with authentication, pass
                pass
            else:
                return redirect(reverse('login_page'))


import logging
from django.contrib.auth.signals import user_logged_in, user_logged_out
from django.urls import resolve

logger = logging.getLogger(__name__)


from django.contrib.auth import get_user_model

class CustomUserMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if request.user.is_authenticated:
            user = get_user_model().objects.get(id=request.user.id)
            logger = logging.getLogger(__name__)
            logger.info('%s %s %s %s', user.username, request.method, request.path, request.META['REMOTE_ADDR'])
        return response

