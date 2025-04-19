from rest_framework import serializers
from django.contrib.auth.models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Task, Project, Routine, Goal, FileAttachment, Notification

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['email']    = user.email
        return token

class RegisterSerializer(serializers.ModelSerializer):
    password1 = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model  = User
        fields = ('username', 'email', 'password1', 'password2')

    def validate(self, attrs):
        if attrs['password1'] != attrs['password2']:
            raise serializers.ValidationError({'password2': "Passwords must match."})
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(
            username = validated_data['username'],
            email    = validated_data.get('email', ''),
            password = validated_data['password1']
        )

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ('id', 'username', 'email')

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model            = Task
        fields           = (
            'id', 'title', 'description',
            'due_date', 'priority',
            'focus_block', 'is_done',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')

    def create(self, validated_data):
        # create task
        user = self.context['request'].user
        validated_data.pop('user', None)
        return Task.objects.create(user=user, **validated_data)


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Project
        fields = '__all__'

class RoutineSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Routine
        fields = '__all__'

class GoalSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Goal
        fields = '__all__'

class FileAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model  = FileAttachment
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Notification
        fields = '__all__'
