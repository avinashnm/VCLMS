from django import forms
from django.forms.widgets import DateInput, TextInput

from .models import *


class FormSettings(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        super(FormSettings, self).__init__(*args, **kwargs)
        # Here make some changes such as:
        for field in self.visible_fields():
            field.field.widget.attrs['class'] = 'form-control'


class CustomUserForm(FormSettings):
    email = forms.EmailField(required=True)
    gender = forms.ChoiceField(choices=[('M', 'Male'), ('F', 'Female')])
    year=forms.ChoiceField(choices=[('1','First Year'),('2','Second Year'),('3','Third Year')])
    
    stream=forms.ChoiceField(choices=[('1','Aided'),('2','SFS')])
    first_name = forms.CharField(required=True)
    last_name = forms.CharField(required=True)
    address = forms.CharField(widget=forms.Textarea)
    password = forms.CharField(widget=forms.PasswordInput)
    widget = {
        'password': forms.PasswordInput(),
    }
    profile_pic = forms.ImageField()

    def __init__(self, *args, **kwargs):
        super(CustomUserForm, self).__init__(*args, **kwargs)

        if kwargs.get('instance'):
            instance = kwargs.get('instance').admin.__dict__
            self.fields['password'].required = False
            for field in CustomUserForm.Meta.fields:
                self.fields[field].initial = instance.get(field)
            if self.instance.pk is not None:
                self.fields['password'].widget.attrs['placeholder'] = "Fill this only if you wish to update password"

    def clean_email(self, *args, **kwargs):
        formEmail = self.cleaned_data['email'].lower()
        if self.instance.pk is None:  # Insert
            if CustomUser.objects.filter(email=formEmail).exists():
                raise forms.ValidationError(
                    "The given email is already registered")
        else:  # Update
            dbEmail = self.Meta.model.objects.get(
                id=self.instance.pk).admin.email.lower()
            if dbEmail != formEmail:  # There has been changes
                if CustomUser.objects.filter(email=formEmail).exists():
                    raise forms.ValidationError("The given email is already registered")

        return formEmail

    class Meta:
        model = CustomUser
        fields = ['first_name', 'last_name', 'email', 'gender', 'year','stream' ,'password','profile_pic', 'address' ]


class StudentForm(CustomUserForm):
    def __init__(self, *args, **kwargs):
        super(StudentForm, self).__init__(*args, **kwargs)

    class Meta(CustomUserForm.Meta):
        model = Student
        fields = CustomUserForm.Meta.fields + \
            ['course']


class AdminForm(CustomUserForm):
    def __init__(self, *args, **kwargs):
        super(AdminForm, self).__init__(*args, **kwargs)

    class Meta(CustomUserForm.Meta):
        model = Admin
        fields = CustomUserForm.Meta.fields


class StaffForm(CustomUserForm):
    def __init__(self, *args, **kwargs):
        super(StaffForm, self).__init__(*args, **kwargs)

    class Meta(CustomUserForm.Meta):
        model = Staff
        fields = CustomUserForm.Meta.fields + \
            ['course']


class CourseForm(FormSettings):
    def __init__(self, *args, **kwargs):
        super(CourseForm, self).__init__(*args, **kwargs)

    class Meta:
        fields = ['name']
        model = Course


class SubjectForm(FormSettings):

    def __init__(self, *args, **kwargs):
        super(SubjectForm, self).__init__(*args, **kwargs)

    class Meta:
        model = Subject
        fields = ['name', 'staff','course']


class SessionForm(FormSettings):
    def __init__(self, *args, **kwargs):
        super(SessionForm, self).__init__(*args, **kwargs)

    class Meta:
        model = Session
        fields = '__all__'
        widgets = {
            'start_year': DateInput(attrs={'type': 'date'}),
            'end_year': DateInput(attrs={'type': 'date'}),
        }


class LeaveReportStaffForm(FormSettings):
    def __init__(self, *args, **kwargs):
        super(LeaveReportStaffForm, self).__init__(*args, **kwargs)

    class Meta:
        model = LeaveReportStaff
        fields = ['date', 'message']
        widgets = {
            'date': DateInput(attrs={'type': 'date'}),
        }


class FeedbackStaffForm(FormSettings):

    def __init__(self, *args, **kwargs):
        super(FeedbackStaffForm, self).__init__(*args, **kwargs)

    class Meta:
        model = FeedbackStaff
        fields = ['feedback']


class LeaveReportStudentForm(FormSettings):
    def __init__(self, *args, **kwargs):
        super(LeaveReportStudentForm, self).__init__(*args, **kwargs)

    class Meta:
        model = LeaveReportStudent
        fields = ['date', 'message']
        widgets = {
            'date': DateInput(attrs={'type': 'date'}),
        }


class FeedbackStudentForm(FormSettings):

    def __init__(self, *args, **kwargs):
        super(FeedbackStudentForm, self).__init__(*args, **kwargs)

    class Meta:
        model = FeedbackStudent
        fields = ['feedback']


class StudentEditForm(CustomUserForm):
    def __init__(self, *args, **kwargs):
        super(StudentEditForm, self).__init__(*args, **kwargs)

    class Meta(CustomUserForm.Meta):
        model = Student
        fields = CustomUserForm.Meta.fields 


class StaffEditForm(CustomUserForm):
    def __init__(self, *args, **kwargs):
        super(StaffEditForm, self).__init__(*args, **kwargs)

    class Meta(CustomUserForm.Meta):
        model = Staff
        fields = CustomUserForm.Meta.fields


class EditResultForm(FormSettings):
    session_list = Session.objects.all()
    session_year = forms.ModelChoiceField(
        label="Session Year", queryset=session_list, required=True)

    def __init__(self, *args, **kwargs):
        super(EditResultForm, self).__init__(*args, **kwargs)

    class Meta:
        model = StudentResult
        fields = ['session_year', 'subject', 'student', 'ca1exam', 'ca2exam','ca3exam','eseexam']



#Study material

from django import forms
from .models import StudyMaterial

class StudyMaterialForm(FormSettings):
    
     def __init__(self, *args, **kwargs):
        super(StudyMaterialForm, self).__init__(*args, **kwargs)
        
     class Meta:
            model = StudyMaterial
            fields = ['title', 'description', 'file_upload', 'subject','session']
            widgets = {
            'description': forms.Textarea(attrs={'rows': 4}),
        }



#video course

from django import forms
from .models import VideoCourse

class VideoCourseForm(FormSettings):
    def __init__(self, *args, **kwargs):
        super(VideoCourseForm, self).__init__(*args, **kwargs)
    class Meta:
        model = VideoCourse
        fields = ['title', 'description', 'video_upload', 'subject']
        labels = {
            'title': 'Title',
            'description': 'Description',
            'video_upload': 'Video Upload',
            'subject': 'Subject',
        }
        widgets = {
            'description': forms.Textarea(attrs={'rows': 5}),
        }



#quiz
'''
from django import forms
from .models import Quiz

class QuizForm(FormSettings):
    
     def __init__(self, *args, **kwargs):
        super(QuizForm, self).__init__(*args, **kwargs)
        
     class Meta:
            model = Quiz
            fields = ['quiz_title', 'quiz_description', 'subject']
            widgets = {
            'description': forms.Textarea(attrs={'rows': 4}),
        }
from django import forms
from .models import Question

class QuestionForm(FormSettings):
    
     def __init__(self, *args, **kwargs):
        super(QuestionForm, self).__init__(*args, **kwargs)
        
     class Meta:
            model = Question
            fields = ['question', 'option1','option2','option3','option4', 'correct_answer']
         


'''
'''
from django import forms
from .models import Quiz, Question, QuizResult


class QuizForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        super(QuizForm, self).__init__(*args, **kwargs)
    class Meta:
        model = Quiz
        fields = ['title', 'description', 'subject']
        widgets = {
            'description': forms.Textarea(attrs={'rows': 4}),
        }


class QuestionForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        super(QuestionForm, self).__init__(*args, **kwargs)
    class Meta:
        model = Question
        fields = ['text', 'option1', 'option2', 'option3', 'option4', 'correct_answer']
        widgets = {
            'text': forms.Textarea(attrs={'rows': 3}),
        }

class QuizResultForm(forms.ModelForm):
    class Meta:
        model = QuizResult
        fields = ['quiz', 'staff', 'score']
        widgets = {
            'quiz': forms.HiddenInput(),
            'staff': forms.HiddenInput(),
            'score': forms.HiddenInput(),
        }
'''
'''

from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.db import transaction
from django.forms.utils import ValidationError

from .models import (Answer, Question, Student, StudentAnswer,
                              Subject)


class QuestionForm(forms.ModelForm):
    class Meta:
        model = Question
        fields = ('text', )


class BaseAnswerInlineFormSet(forms.BaseInlineFormSet):
    def clean(self):
        super().clean()

        has_one_correct_answer = False
        for form in self.forms:
            if not form.cleaned_data.get('DELETE', False):
                if form.cleaned_data.get('is_correct', False):
                    has_one_correct_answer = True
                    break
        if not has_one_correct_answer:
            raise ValidationError('Mark at least one answer as correct.', code='no_correct_answer')


class TakeQuizForm(forms.ModelForm):
    answer = forms.ModelChoiceField(
        queryset=Answer.objects.none(),
        widget=forms.RadioSelect(),
        required=True,
        empty_label=None)

    class Meta:
        model = StudentAnswer
        fields = ('answer', )

    def __init__(self, *args, **kwargs):
        question = kwargs.pop('question')
        super().__init__(*args, **kwargs)
        self.fields['answer'].queryset = question.answers.order_by('text')
'''

from django import forms
from .models import Quiz, Question, Option

class QuizForm(forms.ModelForm):
    class Meta:
        model = Quiz
        fields = ['title', 'description', 'subject']

class QuestionForm(forms.ModelForm):
    class Meta:
        model = Question
        fields = ['text']

class OptionForm(forms.ModelForm):
    is_correct = forms.BooleanField(widget=forms.HiddenInput())
    class Meta:
        model = Option
        fields = ['text', 'is_correct']
        
from django import forms
from .models import QuizResult
class QuizResultForm(forms.ModelForm):
    class Meta:
        model = QuizResult
        fields = [ 'student','score', 'percentage']
        widgets = {
         
            'student':forms.HiddenInput(),
            'score': forms.HiddenInput(),
            'percentage': forms.HiddenInput(),
        }

    def __init__(self, *args, **kwargs):
        super(QuizResultForm, self).__init__(*args, **kwargs)
      
        self.fields['student'].required = False
        self.fields['score'].required = False
        self.fields['percentage'].required = False


#Event forms

#Timetable forms
'''
from django import forms

class TimetableForm(forms.Form):
    day_order = forms.ChoiceField(choices=Timetable.DAY_CHOICES)
    period_order = forms.ChoiceField(choices=Timetable.PERIOD_CHOICES)
    subject = forms.ModelChoiceField(queryset=Subject.objects.all())
    
    
'''


#rating
from django import forms
from .models import RatingQuestion

class RatingQuestionForm(forms.ModelForm):
    class Meta:
        model = RatingQuestion
        fields = ['question_text']
    