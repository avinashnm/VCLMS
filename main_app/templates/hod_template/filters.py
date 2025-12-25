import django_filters
from .models import StudentResult,Student

class StudentResultFilter(django_filters.FilterSet):
    subject = django_filters.CharFilter(lookup_expr='icontains')
    student = django_filters.ModelChoiceFilter(queryset=Student.objects.all())

    class Meta:
        model = StudentResult
        fields = ['subject', 'student']
