from import_export import resources
from django.contrib.auth import get_user_model

class StudentResource(resources.ModelResource):
    class Meta:
        model = get_user_model()
        fields = ('first_name', 'last_name', 'email', 'gender', 'address','course')
