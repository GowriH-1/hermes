import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    username: '',
    age_group: '',
    interests: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const interestsArray = formData.interests
        .split(',')
        .map((i) => i.trim())
        .filter(Boolean);

      await register({
        ...formData,
        interests: interestsArray,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 py-8">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="text-center">Create Account</CardTitle>
          <CardDescription className="text-center">
            Join Gift Portal to start giving and receiving
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">
                {error}
              </div>
            )}
            <Input
              label="Full Name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="John Doe"
              required
            />
            <Input
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="johndoe"
              required
            />
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Age Group
              </label>
              <select
                name="age_group"
                value={formData.age_group}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:bg-gray-800"
              >
                <option value="">Select age group</option>
                <option value="18-24">18-24</option>
                <option value="25-34">25-34</option>
                <option value="35-44">35-44</option>
                <option value="45-54">45-54</option>
                <option value="55+">55+</option>
              </select>
            </div>
            <Input
              label="Interests (comma-separated)"
              name="interests"
              value={formData.interests}
              onChange={handleChange}
              placeholder="tech, gaming, books"
            />
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>
            <p className="text-sm text-center text-gray-600 dark:text-gray-400 dark:text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
