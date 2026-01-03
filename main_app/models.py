from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import UserManager
from django.dispatch import receiver
from django.db.models.signals import post_save
from django.db import models
from django.contrib.auth.models import AbstractUser




class CustomUserManager(UserManager):
    def _create_user(self, email, password, **extra_fields):
        email = self.normalize_email(email)
        user = CustomUser(email=email, **extra_fields)
        user.password = make_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        assert extra_fields["is_staff"]
        assert extra_fields["is_superuser"]
        return self._create_user(email, password, **extra_fields)


class Session(models.Model):
    start_year = models.DateField()
    end_year = models.DateField()

    def __str__(self):
        return "From " + str(self.start_year) + " to " + str(self.end_year)




class CustomUser(AbstractUser):
    USER_TYPE = ((1, "HOD"), (2, "Staff"), (3, "Student"))
    GENDER = [("M", "Male"), ("F", "Female")]
    YEAR=[('1','First Year'),('2','Second Year'),('3','Third Year')]
    STREAM=[('1','Aided'),('2','SFS')]
    #COURSE=[('1','Bsc Chemistry'),('2','Msc Chemistry')]
    
    
    username = None  # Removed username, using email instead
    email = models.EmailField(unique=True)
    user_type = models.CharField(default=1, choices=USER_TYPE, max_length=1)
    gender = models.CharField(max_length=1, choices=GENDER)
    year = models.CharField(max_length=1, default='1', choices=YEAR)
    stream = models.CharField(max_length=1, default='1', choices=STREAM)
    #course=models.CharField(default=1,choices=COURSE)
    profile_pic = models.ImageField()
    address = models.TextField()
    fcm_token = models.TextField(default="")  # For firebase notifications
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []
    objects = CustomUserManager()

    def __str__(self):
        return self.first_name+ ", " + self.last_name


class Admin(models.Model):
    admin = models.OneToOneField(CustomUser, on_delete=models.CASCADE)



class Course(models.Model):
    name = models.CharField(max_length=120)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Student(models.Model):
    admin = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.DO_NOTHING, null=True, blank=False)

    def __str__(self):
        return self.admin.first_name + " " + self.admin.last_name
    def get_full_name(self):
            return self.admin.get_full_name()

class Staff(models.Model):
    
    admin = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    course= models.ForeignKey(Course, on_delete=models.DO_NOTHING, null=True, blank=False)
    def __str__(self):
        return self.admin.first_name + " " + self.admin.last_name


class Subject(models.Model):
    name = models.CharField(max_length=120)
    staff = models.ForeignKey(Staff,on_delete=models.CASCADE,)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
    
    


class Attendance(models.Model):
    session = models.ForeignKey(Session, on_delete=models.DO_NOTHING)
    subject = models.ForeignKey(Subject, on_delete=models.DO_NOTHING)
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
def attendance_percentage(self):
    total_days = Attendance.objects.filter(student=self.student).count()
    present_days = Attendance.objects.filter(student=self.student, status=True).count()
    percentage = (present_days / total_days) * 100 if total_days > 0 else 0
    return percentage


class AttendanceReport(models.Model):
    student = models.ForeignKey(Student, on_delete=models.DO_NOTHING)
    attendance = models.ForeignKey(Attendance, on_delete=models.CASCADE)
    status = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
def __init__(self, student, date):
        self.student = student
        self.date = date
        self.attendance = Attendance.objects.filter(student=student, date=date).first()
        self.status = "Present" if self.attendance.status else "Absent"
        self.total_days = Attendance.objects.filter(student=self.student).count()

def attendance_percentage(self):
        total_days = Attendance.objects.filter(student=self.student).count()
        present_days = Attendance.objects.filter(student=self.student, status=True).count()
        percentage = (present_days / total_days) * 100 if total_days > 0 else 0
        return percentage


class LeaveReportStudent(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    date = models.CharField(max_length=60)
    message = models.TextField()
    status = models.SmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class LeaveReportStaff(models.Model):
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE)
    date = models.CharField(max_length=60)
    message = models.TextField()
    status = models.SmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class FeedbackStudent(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    feedback = models.TextField()
    reply = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


import nltk
from nltk.sentiment import SentimentIntensityAnalyzer

class FeedbackStaff(models.Model):
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE)
    feedback = models.TextField()
    reply = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def get_sentiment(self):
        sid = SentimentIntensityAnalyzer()
        polarity_scores = sid.polarity_scores(self.feedback)
        # polarity_scores is a dictionary containing the scores for negative, neutral, positive, and compound sentiment
        return polarity_scores



class NotificationStaff(models.Model):
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class NotificationStudent(models.Model):
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    

class StudentResult(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    ca1exam = models.FloatField(default=0)
    ca2exam = models.FloatField(default=0)
    ca3exam = models.FloatField(default=0)
    eseexam = models.FloatField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


@receiver(post_save, sender=CustomUser)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        if instance.user_type == 1:
            Admin.objects.create(admin=instance)
        if instance.user_type == 2:
            Staff.objects.create(admin=instance)
        if instance.user_type == 3:
            Student.objects.create(admin=instance)


@receiver(post_save, sender=CustomUser)
def save_user_profile(sender, instance, **kwargs):
    if instance.user_type == 1:
        instance.admin.save()
    if instance.user_type == 2:
        instance.staff.save()
    if instance.user_type == 3:
        instance.student.save()





    
    
    
    
#study materials

class StudyMaterial(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    file_upload = models.FileField(upload_to='study_materials/')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    session=models.ForeignKey(Session, on_delete=models.CASCADE)
    date_added = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
    
#video course

class VideoCourse(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    video_upload = models.FileField(upload_to='study_videos/')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    date_added = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
    
#quiz


from django.db import models



class Quiz(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField()
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)

    def __str__(self):
        return self.title

class Question(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    text = models.TextField()

    def __str__(self):
        return self.text

class Option(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    text = models.CharField(max_length=200)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return self.text
    
    
    
    
    
    
#Events Management

from django.db import models
from django.contrib.auth.models import User

class QuizResult(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    score = models.IntegerField()
    percentage = models.DecimalField(max_digits=5, decimal_places=2)
    date_taken = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f" {self.quiz.title}"
#models for log report

    
from django.db import models


class RatingQuestion(models.Model):
    question_text = models.CharField(max_length=200)

    def __str__(self):
        return self.question_text

class Rating(models.Model):
    student=models.ForeignKey(Student, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    question = models.ForeignKey(RatingQuestion, on_delete=(models.CASCADE))
    rating = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.question.question_text} - {self.subject.name}: {self.rating}"
    
    
    
    
    
    
#form models


class Choices(models.Model):
    choice = models.TextField(max_length=5000)
    is_answer = models.BooleanField(default=False)

class Questions(models.Model):
    question = models.TextField(max_length= 10000)
    question_type = models.TextField(max_length=20)
    required = models.BooleanField(default= False)
    answer_key = models.TextField(max_length = 5000, blank = True)
    score = models.IntegerField(blank = True, default=0)
    feedback = models.TextField(max_length = 5000, null = True)
    choices = models.ManyToManyField(Choices, related_name = "choices")

class Answer(models.Model):
    answer = models.TextField(max_length=5000)
    answer_to = models.ForeignKey(Questions, on_delete = models.CASCADE ,related_name = "answer_to")

class Form(models.Model):
    code = models.TextField(max_length=30)
    title = models.TextField(max_length=200)
    description = models.TextField(max_length=10000, blank = True)
    creator = models.ForeignKey(CustomUser, on_delete = models.CASCADE, related_name = "creator")
    background_color = models.TextField(max_length=20, default = "#d9efed")
    text_color = models.TextField(max_length=20, default="#272124")
    collect_email = models.BooleanField(default=False)
    authenticated_responder = models.BooleanField(default = False)
    edit_after_submit = models.BooleanField(default=False)
    confirmation_message = models.TextField(max_length = 10000, default = "Your response has been recorded.")
    is_quiz = models.BooleanField(default=False)
    allow_view_score = models.BooleanField(default= True)
    createdAt = models.DateTimeField(auto_now_add = True)
    updatedAt = models.DateTimeField(auto_now = True)
    questions = models.ManyToManyField(Questions, related_name = "questions")

class Responses(models.Model):
    response_code = models.TextField(max_length=20)
    response_to = models.ForeignKey(Form, on_delete = models.CASCADE, related_name = "response_to")
    responder_ip = models.TextField(max_length=30)
    responder = models.ForeignKey(CustomUser, on_delete = models.CASCADE, related_name = "responder", blank = True, null = True)
    responder_email = models.EmailField(blank = True)
    response = models.ManyToManyField(Answer, related_name = "response")





#experiment review


from django.db import models

class Experiment(models.Model):
    student_id = models.ForeignKey(Student, on_delete=models.DO_NOTHING)
    graph_image = models.ImageField(upload_to='graph_images/')
    experience_review = models.TextField()
   
class VirtualLabSubmission(models.Model):
    # Wrap Student in quotes 'Student' to make it a string reference
    student = models.ForeignKey('Student', on_delete=models.CASCADE) 
    experiment_name = models.CharField(max_length=200)
    v1_observed = models.FloatField()
    v2_observed = models.FloatField()
    calc_na2co3 = models.FloatField()
    calc_nahco3 = models.FloatField()
    total_score = models.IntegerField()
    penalty_log = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.admin.first_name} - {self.experiment_name}"