# Do-It 🚀

**Transform from tutorial follower to product builder in weeks, not years.**

[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![Django](https://img.shields.io/badge/Django-5.2.0-092E20?style=flat&logo=django)](https://www.djangoproject.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3.0-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Do-It is a comprehensive learning platform that bridges the gap between theory and practice. Built by engineers who've scaled systems to millions of users, Do-It provides hands-on learning experiences that transform developers into production-ready engineers.

## ✨ What Makes Do-It Different

Unlike traditional bootcamps that focus on lectures and theory, Do-It emphasizes **building real products**. Our platform combines:

- **Project-Based Learning** - Ship actual applications that solve real problems
- **Expert Mentorship** - Weekly live coding sessions with senior engineers
- **Career Acceleration** - Proven track record of 3x faster career growth
- **Community Support** - Learn alongside a network of ambitious developers

## 🚀 Key Features

### For Learners
- **Real-World Projects** - Build production-ready applications from day one
- **Expert Pair Programming** - Weekly live sessions with industry professionals
- **Career Coaching** - Personalized guidance for job placement and growth
- **Progress Tracking** - Visual dashboards showing skill development
- **Community Forums** - Connect with peers and mentors worldwide

### For Educators & Mentors
- **Structured Curriculum** - Industry-aligned learning paths
- **Assessment Tools** - Track learner progress and identify gaps
- **Mentorship Platform** - Connect mentors with learners effectively
- **Analytics Dashboard** - Insights into learning outcomes and engagement

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern component-based UI framework
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Lucide React** - Beautiful icon library
- **Axios** - HTTP client for API calls

### Backend
- **Django 5.2** - High-level Python web framework
- **Django REST Framework** - Powerful API toolkit
- **PostgreSQL** - Advanced open source relational database
- **JWT Authentication** - Secure token-based auth
- **Django Allauth** - Integrated set of Django applications

### DevOps & Deployment
- **Docker** - Containerization platform
- **GitHub Actions** - CI/CD pipelines
- **Vercel/Netlify** - Frontend deployment
- **AWS/Heroku** - Backend deployment

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **Python** (v3.8 or higher)
- **PostgreSQL** (v12 or higher)
- **Git**
- **Docker** (optional, for containerized deployment)

## 🚀 Installation & Setup

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/do-it.git
   cd do-it
   ```

2. **Set up Python virtual environment**
   ```bash
   cd backend
   python -m venv env
   source env/bin/activate  # On Windows: env\Scripts\activate
   ```

3. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up PostgreSQL database**
   ```sql
   CREATE DATABASE doit_db;
   CREATE USER doit_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE doit_db TO doit_user;
   ```

5. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and secret keys
   ```

6. **Run migrations**
   ```bash
   python manage.py migrate
   ```

7. **Create superuser**
   ```bash
   python manage.py createsuperuser
   ```

8. **Start the development server**
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd ../frontend
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   # Add your API endpoints and configuration
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## 🎯 Usage

### For Learners

1. **Sign Up** - Create your account with email verification
2. **Choose Your Path** - Select from available learning tracks
3. **Start Building** - Begin with hands-on projects
4. **Get Mentored** - Schedule sessions with industry experts
5. **Track Progress** - Monitor your skill development
6. **Network** - Connect with peers and potential employers

### For Mentors

1. **Apply as Mentor** - Submit your expertise and experience
2. **Set Availability** - Define your mentoring schedule
3. **Guide Learners** - Provide feedback and support
4. **Share Knowledge** - Contribute to the learning community

## 📚 API Documentation

### Authentication Endpoints

```
POST /api/auth/registration/          # User registration
POST /api/auth/login/                 # User login
POST /api/auth/logout/                # User logout
GET  /api/auth/user/                  # Get current user
```

### Learning Endpoints

```
GET    /api/courses/                  # List all courses
POST   /api/courses/                  # Create new course
GET    /api/courses/{id}/             # Get course details
PUT    /api/courses/{id}/             # Update course
DELETE /api/courses/{id}/             # Delete course

GET    /api/enrollments/              # User's enrollments
POST   /api/enrollments/              # Enroll in course
```

### Community Endpoints

```
GET    /api/posts/                    # Community posts
POST   /api/posts/                    # Create post
GET    /api/mentors/                  # Available mentors
POST   /api/mentoring/sessions/       # Book mentoring session
```

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Run tests**
   ```bash
   # Backend tests
   cd backend && python manage.py test

   # Frontend tests
   cd frontend && npm test
   ```
5. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Code Style

- **Python**: Follow PEP 8 guidelines
- **JavaScript**: Use ESLint configuration
- **CSS**: Follow Tailwind CSS conventions
- **Commits**: Use conventional commit format

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Engineering Team**: Built by engineers from Google, Stripe, Netflix
- **Open Source Community**: Thanks to all contributors
- **Mentors & Learners**: For making this platform valuable

## 📞 Support

- **Documentation**: [docs.do-it.com](https://docs.do-it.com)
- **Community Forum**: [community.do-it.com](https://community.do-it.com)
- **Email Support**: support@do-it.com

---

**Ready to transform your career?** [Start Learning Today](https://do-it.com) 🚀
