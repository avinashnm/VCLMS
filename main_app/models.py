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
    observations = models.JSONField(default=dict)
    calculations = models.JSONField(default=dict)
    total_score = models.IntegerField()
    penalty_log = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.admin.first_name} - {self.experiment_name}"

# Dynamic Virtual Lab Models

class LabExperiment(models.Model):
    TYPE_DOUBLE_INDICATOR = "double_indicator"
    TYPE_SIMPLE_TITRATION = "simple_titration"
    EXPERIMENT_TYPE_CHOICES = [
        (TYPE_DOUBLE_INDICATOR, "Double Indicator Titration"),
        (TYPE_SIMPLE_TITRATION, "Simple Titration"),
    ]

    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    objective = models.TextField()
    principle = models.TextField(blank=True, null=True)
    # Values enforced in LabExperimentForm / HOD UI; engine supports double_indicator & simple_titration.
    type = models.CharField(max_length=50, default=TYPE_DOUBLE_INDICATOR)
    initial_state_json = models.JSONField(
        default=list,
        blank=True,
        help_text="Scene items (apparatus, locations, optional contents) for the simulation.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class ExperimentMaterial(models.Model):
    experiment = models.ForeignKey(LabExperiment, on_delete=models.CASCADE, related_name='materials')
    name = models.CharField(max_length=200)

    def __str__(self):
        return f"{self.name} ({self.experiment.title})"

class ExperimentStep(models.Model):
    experiment = models.ForeignKey(LabExperiment, on_delete=models.CASCADE, related_name='steps')
    step_number = models.PositiveIntegerField()
    description = models.TextField()

    class Meta:
        ordering = ['step_number']

    def __str__(self):
        return f"Step {self.step_number} - {self.experiment.title}"

class ExperimentMilestone(models.Model):
    experiment = models.ForeignKey(LabExperiment, on_delete=models.CASCADE, related_name='milestones')
    milestone_id = models.CharField(max_length=100) # e.g., 'fill_burette'
    description = models.CharField(max_length=200)
    instruction = models.TextField(blank=True, null=True, help_text="Shown in the Lab Assistant panel as guidance to the student for completing this step.")
    points = models.IntegerField(default=10)
    
    # NEW: Link to Reaction Builder for automated color triggers
    linked_reaction = models.ForeignKey('ChemicalReaction', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.milestone_id} ({self.experiment.title})"

class ExperimentTargetConfig(models.Model):
    experiment = models.OneToOneField(LabExperiment, on_delete=models.CASCADE, related_name='target_config')
    v1_min = models.FloatField(default=9.5)
    v1_max = models.FloatField(default=11.5)
    v1_color = models.CharField(max_length=9, default="#FF69B4A0", help_text="Flask color at V1")
    v2_min = models.FloatField(default=23.0)
    v2_max = models.FloatField(default=27.0)
    v2_color = models.CharField(max_length=9, default="#FFD700B4", help_text="Flask color at V2")

    def __str__(self):
        return f"Targets for {self.experiment.title}"


# ==========================================
# PHASE 3: TRUE NO-CODE PLATFORM MODELS
# ==========================================

class ChemicalCatalog(models.Model):
    name = models.CharField(max_length=150, unique=True)
    formula = models.CharField(max_length=100)
    molarity = models.FloatField(null=True, blank=True, help_text="Default molarity if applicable")
    density = models.FloatField(default=1.0, help_text="g/mL")
    default_color_hex = models.CharField(max_length=9, default="#FFFFFF80", help_text="Format: #RRGGBBAA")
    is_indicator = models.BooleanField(default=False)
    
    # NEW: Data-Driven Indicator Properties
    low_ph_color = models.CharField(max_length=9, default="#FFFF00A0", help_text="#RRGGBBAA for acidic color (e.g. Yellow for Methyl Orange)")
    high_ph_color = models.CharField(max_length=9, default="#FF00FFA0", help_text="#RRGGBBAA for basic color (e.g. Pink for Phenolphthalein)")
    transition_ph_range = models.CharField(max_length=20, default="8.2-10.0", help_text="Lower and Upper pH bound, e.g. '8.2-10.0'")
    
    def __str__(self):
        return f"{self.name} ({self.formula})"

class ApparatusCatalog(models.Model):
    name = models.CharField(max_length=100, unique=True)
    type = models.CharField(max_length=50, help_text="e.g., volumetric_flask, beaker, burette")
    max_capacity = models.FloatField(help_text="In mL")
    svg_sprite_url = models.CharField(max_length=255, blank=True, null=True)
    is_heatable = models.BooleanField(default=False)
    can_measure_vol = models.BooleanField(default=False)
    can_pour = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.name} ({self.max_capacity}mL)"

class ChemicalReaction(models.Model):
    chemical_a = models.ForeignKey(ChemicalCatalog, related_name='reactions_as_a', on_delete=models.CASCADE)
    chemical_b = models.ForeignKey(ChemicalCatalog, related_name='reactions_as_b', on_delete=models.CASCADE)
    product = models.ForeignKey(ChemicalCatalog, related_name='reactions_as_product', on_delete=models.CASCADE, null=True, blank=True)
    reaction_color_hex = models.CharField(max_length=9, default="#FFFFFF80")
    ph_change = models.FloatField(default=0.0)
    
    def __str__(self):
        return f"{self.chemical_a.name} + {self.chemical_b.name} Reaction"

class MilestoneRule(models.Model):
    OPERATOR_CHOICES = [
        ('>', 'Greater Than'),
        ('>=', 'Greater Than or Equal'),
        ('<', 'Less Than'),
        ('<=', 'Less Than or Equal'),
        ('==', 'Equal To'),
        ('!=', 'Not Equal To'),
        ('CONTAINS', 'Contains Object'),
    ]
    
    milestone = models.ForeignKey(ExperimentMilestone, on_delete=models.CASCADE, related_name='rules')
    target_vessel = models.CharField(max_length=100, help_text="e.g., 'conical_flask' or apparatus ID")
    target_property = models.CharField(max_length=100, help_text="e.g., 'hcl_vol', 'temperature', 'ph'")
    operator = models.CharField(max_length=10, choices=OPERATOR_CHOICES, default='>=')
    value = models.FloatField(help_text="Target threshold value")
    
    def __str__(self):
        return f"Rule: IF {self.target_vessel}.{self.target_property} {self.operator} {self.value}"

class ObservationPrompt(models.Model):
    milestone = models.ForeignKey(ExperimentMilestone, on_delete=models.CASCADE, related_name='observation_prompts')
    title = models.CharField(max_length=200, help_text="e.g., 'v1_reading'")
    description = models.TextField(help_text="e.g., 'Enter the endpoint (V1) reading in mL:'")
    target_vessel = models.CharField(max_length=100, default="burette", help_text="Vessel to check against")
    target_property = models.CharField(max_length=100, default="reading", help_text="Property to check (e.g. 'reading', 'volume')")
    tolerance = models.FloatField(default=0.2, help_text="Margin of error allowed for students")
    penalty_points = models.IntegerField(default=10)

    def __str__(self):
        return f"Obs Prompt: {self.title} ({self.milestone.experiment.title})"

class CalculationPrompt(models.Model):
    milestone = models.ForeignKey(ExperimentMilestone, on_delete=models.CASCADE, related_name='calculation_prompts')
    title = models.CharField(max_length=200, help_text="e.g., 'mass_na2co3'")
    description = models.TextField(help_text="Math problem instructions for the student.")
    formula = models.CharField(max_length=255, help_text="e.g., '(v1_reading * 0.1 * 106) / 1000'. Extracted variables must match Observation titles.")
    tolerance = models.FloatField(default=0.05, help_text="Allowed math variance")
    points = models.IntegerField(default=15)

    def __str__(self):
        return f"Calc Prompt: {self.title} ({self.milestone.experiment.title})"

# ==========================================
# PHASE 4: PATH-BASED LMS
# ==========================================

class LessonModule(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="modules")
    title = models.CharField(max_length=200)
    description = models.TextField()
    video_course = models.ForeignKey(VideoCourse, null=True, blank=True, on_delete=models.SET_NULL)
    quiz = models.ForeignKey(Quiz, null=True, blank=True, on_delete=models.SET_NULL)
    experiment = models.ForeignKey(LabExperiment, null=True, blank=True, on_delete=models.SET_NULL)
    pass_percentage = models.FloatField(default=60.0, help_text="Minimum Quiz % to unlock lab")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.subject.name})"

class StudentProgress(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="progress")
    lesson_module = models.ForeignKey(LessonModule, on_delete=models.CASCADE, related_name="progress")
    video_watched = models.BooleanField(default=False)
    quiz_passed = models.BooleanField(default=False)
    latest_quiz_score = models.FloatField(default=0.0)
    lab_completed = models.BooleanField(default=False)
    lab_score = models.FloatField(default=0.0)
    overall_grade = models.FloatField(default=0.0)
    last_accessed = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('student', 'lesson_module')

    def __str__(self):
        return f"{self.student.admin.first_name} - {self.lesson_module.title}"
