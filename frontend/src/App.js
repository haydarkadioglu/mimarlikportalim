import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Badge } from "./components/ui/badge";
import { Separator } from "./components/ui/separator";
import { toast } from "./hooks/use-toast";
import { Toaster } from "./components/ui/toaster";
import { Play, BookOpen, Users, Award, Mail, Phone, MapPin, Menu, X, ShoppingCart } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Debug için axios interceptor ekleyelim
axios.interceptors.request.use(request => {
  console.log('Starting Request:', request.url);
  return request;
});

axios.interceptors.response.use(
  response => {
    console.log('Response:', response);
    return response;
  },
  error => {
    console.error('API Error:', error.response?.data || error.message);
    console.error('Request URL:', error.config?.url);
    return Promise.reject(error);
  }
);

// Auth Context
const AuthContext = React.createContext();

const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserData(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserData = async (token) => {
    try {
      const response = await axios.get(`${API}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/login`, { email, password });
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      await fetchUserData(access_token);
      return true;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Giriş başarısız');
    }
  };

  const register = async (userData) => {
    try {
      await axios.post(`${API}/register`, userData);
      return true;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Kayıt başarısız');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Navigation Component
const Navigation = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-lg border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              MimarımPortal
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-8">
              <a href="#home" className="text-gray-700 hover:text-blue-600 transition-colors">Ana Sayfa</a>
              <a href="#about" className="text-gray-700 hover:text-blue-600 transition-colors">Hakkımızda</a>
              <a href="#courses" className="text-gray-700 hover:text-blue-600 transition-colors">Eğitimler</a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 transition-colors">İletişim</a>
              {user ? (
                <div className="flex items-center space-x-4">
                  <Button variant="outline" onClick={() => window.location.href = '#dashboard'}>
                    Dashboard
                  </Button>
                  {user.role === 'admin' && (
                    <Button variant="outline" onClick={() => window.location.href = '#admin'}>
                      Admin
                    </Button>
                  )}
                  <Button onClick={logout}>Çıkış</Button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Button variant="outline" onClick={() => window.location.href = '#login'}>
                    Giriş
                  </Button>
                  <Button onClick={() => window.location.href = '#register'}>
                    Kayıt Ol
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <a href="#home" className="block px-3 py-2 text-gray-700">Ana Sayfa</a>
            <a href="#about" className="block px-3 py-2 text-gray-700">Hakkımızda</a>
            <a href="#courses" className="block px-3 py-2 text-gray-700">Eğitimler</a>
            <a href="#contact" className="block px-3 py-2 text-gray-700">İletişim</a>
            {user ? (
              <>
                <a href="#dashboard" className="block px-3 py-2 text-gray-700">Dashboard</a>
                {user.role === 'admin' && (
                  <a href="#admin" className="block px-3 py-2 text-gray-700">Admin</a>
                )}
                <button onClick={logout} className="block px-3 py-2 text-gray-700 w-full text-left">
                  Çıkış
                </button>
              </>
            ) : (
              <>
                <a href="#login" className="block px-3 py-2 text-gray-700">Giriş</a>
                <a href="#register" className="block px-3 py-2 text-gray-700">Kayıt Ol</a>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

// Course Detail Page
const CourseDetailPage = ({ courseId }) => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchCourseDetail();
  }, [courseId]);

  const fetchCourseDetail = async () => {
    try {
      const response = await axios.get(`${API}/courses`);
      const foundCourse = response.data.find(c => c.id === courseId);
      setCourse(foundCourse);
    } catch (error) {
      console.error('Kurs detayları yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!user) {
      window.location.href = '#login';
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/purchase/${courseId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (course.price === 0) {
        toast({
          title: "Başarılı!",
          description: "Ücretsiz eğitime kayıt oldunuz. Dashboard'dan erişebilirsiniz.",
        });
      } else {
        toast({
          title: "Başarılı!",
          description: "Eğitim başarıyla satın alındı. Dashboard'dan erişebilirsiniz.",
        });
      }
      
      setTimeout(() => {
        window.location.href = '#dashboard';
      }, 1500);
    } catch (error) {
      toast({
        title: "Hata!",
        description: error.response?.data?.detail || "Satın alma işlemi başarısız.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-16 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Eğitim detayları yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen pt-16 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Eğitim Bulunamadı</h1>
          <Button onClick={() => window.location.href = '#home'}>
            Ana Sayfaya Dön
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Button 
          variant="outline" 
          onClick={() => window.location.href = '#home'}
          className="mb-6"
        >
          ← Ana Sayfaya Dön
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {course.thumbnail_url && (
                <div className="aspect-video bg-gray-200">
                  <img 
                    src={course.thumbnail_url} 
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="p-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
                <p className="text-lg text-gray-700 mb-6">{course.description}</p>
                
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-4">Eğitim İçeriği</h3>
                  {course.videos && course.videos.length > 0 ? (
                    <div className="space-y-3">
                      {course.videos.map((video, index) => (
                        <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <Play className="w-5 h-5 text-blue-600 mr-3" />
                          <div className="flex-1">
                            <h4 className="font-medium">{video.title}</h4>
                            {video.description && (
                              <p className="text-sm text-gray-600">{video.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">Henüz video eklenmemiş.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Purchase Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  {course.price === 0 ? (
                    <div>
                      <span className="text-3xl font-bold text-green-600">ÜCRETSİZ</span>
                      <p className="text-sm text-gray-600 mt-1">Bu eğitim tamamen ücretsiz!</p>
                    </div>
                  ) : (
                    <div>
                      <span className="text-3xl font-bold text-blue-600">
                        {course.price} {course.currency}
                      </span>
                      <p className="text-sm text-gray-600 mt-1">Tek seferlik ödeme</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Video Sayısı:</span>
                    <span className="font-semibold">{course.videos?.length || 0} Video</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Erişim:</span>
                    <span className="font-semibold">Sınırsız</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Sertifika:</span>
                    <span className="font-semibold">Var</span>
                  </div>
                </div>

                <Button 
                  className="w-full text-lg py-6" 
                  onClick={handlePurchase}
                >
                  {course.price === 0 ? (
                    <>
                      <BookOpen className="mr-2 h-5 w-5" />
                      Ücretsiz Kayıt Ol
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Satın Al
                    </>
                  )}
                </Button>

                {!user && (
                  <p className="text-sm text-gray-600 text-center mt-4">
                    Satın almak için <a href="#login" className="text-blue-600 hover:underline">giriş yapın</a>
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// Home Page
const HomePage = () => {
  const [courses, setCourses] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${API}/courses`);
      setCourses(response.data);
    } catch (error) {
      console.error('Kurslar yüklenemedi:', error);
    }
  };

  const handleCourseView = (courseId) => {
    window.location.href = `#course/${courseId}`;
  };

  const handleQuickPurchase = async (courseId, price) => {
    if (!user) {
      window.location.href = '#login';
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/purchase/${courseId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (price === 0) {
        toast({
          title: "Başarılı!",
          description: "Ücretsiz eğitime kayıt oldunuz. Dashboard'dan erişebilirsiniz.",
        });
      } else {
        toast({
          title: "Başarılı!",
          description: "Eğitim başarıyla satın alındı. Dashboard'dan erişebilirsiniz.",
        });
      }
    } catch (error) {
      toast({
        title: "Hata!",
        description: error.response?.data?.detail || "Satın alma işlemi başarısız.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
          <div className="absolute inset-0 opacity-30">
            <div className="floating-shapes">
              <div className="shape shape-1"></div>
              <div className="shape shape-2"></div>
              <div className="shape shape-3"></div>
              <div className="shape shape-4"></div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-center text-white px-4 max-w-6xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Mimariye Dair <br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Her Şey Burada
            </span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-300 leading-relaxed">
            Profesyonel mimar eğitimleri ile kendinizi geliştirin. 
            Uzman eğitmenlerden öğrenin, projelerinizi bir üst seviyeye taşıyın.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-6 bg-blue-600 hover:bg-blue-700">
              <BookOpen className="mr-2" />
              Eğitimleri İncele
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-slate-900">
              <Users className="mr-2" />
              Hakkımızda
            </Button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Hakkımızda</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              15 yıllık deneyimimiz ile mimarlık alanında uzmanlaşmış, 
              binlerce öğrenci yetiştirmiş profesyonel bir ekibiz.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <Award className="w-16 h-16 mx-auto text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Uzman Eğitmenler</h3>
                <p className="text-gray-600">Alanında uzman, deneyimli mimarlardan öğrenin</p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <BookOpen className="w-16 h-16 mx-auto text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Kaliteli İçerik</h3>
                <p className="text-gray-600">Güncel ve pratik bilgilerle dolu eğitim içerikleri</p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <Users className="w-16 h-16 mx-auto text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Geniş Topluluk</h3>
                <p className="text-gray-600">Binlerce mimar ile network kurma imkanı</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section id="courses" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Eğitimlerimiz</h2>
            <p className="text-xl text-gray-600">Profesyonel gelişiminiz için hazırladığımız eğitim paketleri</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <Card key={course.id} className="hover:shadow-xl transition-shadow duration-300">
                {course.thumbnail_url && (
                  <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
                    <img 
                      src={course.thumbnail_url} 
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl">{course.title}</CardTitle>
                  <CardDescription className="text-gray-600 line-clamp-3">
                    {course.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <Badge variant="secondary">
                      {course.videos?.length || 0} Video
                    </Badge>
                    {course.price === 0 ? (
                      <span className="text-2xl font-bold text-green-600">
                        ÜCRETSİZ
                      </span>
                    ) : (
                      <span className="text-2xl font-bold text-blue-600">
                        {course.price} {course.currency}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Button 
                      variant="outline"
                      className="w-full" 
                      onClick={() => handleCourseView(course.id)}
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      Detaylarını İncele
                    </Button>
                    <Button 
                      className="w-full" 
                      onClick={() => handleQuickPurchase(course.id, course.price)}
                    >
                      {course.price === 0 ? (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Ücretsiz Kayıt Ol
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Hızlı Satın Al
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">İletişim</h2>
            <p className="text-xl text-gray-600">Sorularınız için bizimle iletişime geçin</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-8">
              <CardContent className="pt-6">
                <Mail className="w-12 h-12 mx-auto text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">E-posta</h3>
                <p className="text-gray-600">info@mimarimportal.com</p>
              </CardContent>
            </Card>

            <Card className="text-center p-8">
              <CardContent className="pt-6">
                <Phone className="w-12 h-12 mx-auto text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Telefon</h3>
                <p className="text-gray-600">+90 555 123 45 67</p>
              </CardContent>
            </Card>

            <Card className="text-center p-8">
              <CardContent className="pt-6">
                <MapPin className="w-12 h-12 mx-auto text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Adres</h3>
                <p className="text-gray-600">İstanbul, Türkiye</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

// Login Page
const LoginPage = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      toast({
        title: "Başarılı!",
        description: "Giriş yapıldı. Yönlendiriliyorsunuz...",
      });
      setTimeout(() => {
        window.location.href = '#dashboard';
      }, 1000);
    } catch (error) {
      toast({
        title: "Hata!",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-16 bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Giriş Yap</CardTitle>
          <CardDescription>
            Hesabınıza giriş yapın
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Hesabınız yok mu?{' '}
              <a href="#register" className="text-blue-600 hover:underline">
                Kayıt olun
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Register Page
const RegisterPage = () => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    gender: '',
    email: '',
    password: '',
    phone: '',
    birth_date: '',
    country: '',
    city: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await register(formData);
      toast({
        title: "Başarılı!",
        description: "Kayıt tamamlandı. Şimdi giriş yapabilirsiniz.",
      });
      setTimeout(() => {
        window.location.href = '#login';
      }, 1000);
    } catch (error) {
      toast({
        title: "Hata!",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-16 bg-gray-50 flex items-center justify-center py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Kayıt Ol</CardTitle>
          <CardDescription>
            Yeni hesap oluşturun
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">Ad</Label>
                <Input
                  id="first_name"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="last_name">Soyad</Label>
                <Input
                  id="last_name"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="gender">Cinsiyet</Label>
              <Select onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Cinsiyet seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Erkek</SelectItem>
                  <SelectItem value="female">Kadın</SelectItem>
                  <SelectItem value="other">Diğer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="birth_date">Doğum Tarihi</Label>
              <Input
                id="birth_date"
                type="date"
                required
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="country">Ülke</Label>
                <Input
                  id="country"
                  required
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="city">Şehir</Label>
                <Input
                  id="city"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Zaten hesabınız var mı?{' '}
              <a href="#login" className="text-blue-600 hover:underline">
                Giriş yapın
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Dashboard Page
const DashboardPage = () => {
  const { user } = useAuth();
  const [myCourses, setMyCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => {
    if (user) {
      fetchMyCourses();
    }
  }, [user]);

  const fetchMyCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/my-courses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyCourses(response.data);
    } catch (error) {
      console.error('Kurslar yüklenemedi:', error);
    }
  };

  const viewCourse = async (courseId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/course/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedCourse(response.data);
    } catch (error) {
      toast({
        title: "Hata!",
        description: "Kurs detayları yüklenemedi.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return <Navigate to="#login" />;
  }

  if (selectedCourse) {
    return (
      <div className="min-h-screen pt-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => setSelectedCourse(null)}
              className="mb-4"
            >
              ← Eğitimlerime Dön
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">{selectedCourse.title}</h1>
            <p className="text-gray-600 mt-2">{selectedCourse.description}</p>
          </div>

          <div className="space-y-6">
            {selectedCourse.videos.map((video, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="w-5 h-5" />
                    {video.title}
                  </CardTitle>
                  {video.description && (
                    <CardDescription>{video.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                    <iframe
                      src={video.vimeo_url}
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      title={video.title}
                    ></iframe>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Hoş geldiniz, {user.first_name}!</p>
        </div>

        <Tabs defaultValue="courses" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="courses">Eğitimlerim</TabsTrigger>
            <TabsTrigger value="profile">Profil</TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Satın Aldığınız Eğitimler</h2>
              {myCourses.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4">Henüz hiç eğitim satın almadınız.</p>
                    <Button onClick={() => window.location.href = '#courses'}>
                      Eğitimleri İnceleyin
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myCourses.map((course) => (
                    <Card key={course.id} className="hover:shadow-lg transition-shadow">
                      {course.thumbnail_url && (
                        <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
                          <img 
                            src={course.thumbnail_url} 
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle>{course.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {course.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center mb-4">
                          <Badge variant="secondary">
                            {course.videos.length} Video
                          </Badge>
                        </div>
                        <Button 
                          className="w-full" 
                          onClick={() => viewCourse(course.id)}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          İzlemeye Başla
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profil Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Ad Soyad</Label>
                    <p className="text-gray-900 font-medium">{user.first_name} {user.last_name}</p>
                  </div>
                  <div>
                    <Label>E-posta</Label>
                    <p className="text-gray-900 font-medium">{user.email}</p>
                  </div>
                  <div>
                    <Label>Telefon</Label>
                    <p className="text-gray-900 font-medium">{user.phone}</p>
                  </div>
                  <div>
                    <Label>Konum</Label>
                    <p className="text-gray-900 font-medium">{user.city}, {user.country}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Admin Page
const AdminPage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    currency: 'TRY',
    thumbnail_url: '',
    videos: []
  });

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchCourses();
    }
  }, [user]);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/admin/courses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(response.data);
    } catch (error) {
      console.error('Kurslar yüklenemedi:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const data = {
        ...formData,
        price: parseFloat(formData.price)
      };

      if (editingCourse) {
        await axios.put(`${API}/admin/courses/${editingCourse.id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast({
          title: "Başarılı!",
          description: "Eğitim güncellendi.",
        });
      } else {
        await axios.post(`${API}/admin/courses`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast({
          title: "Başarılı!",
          description: "Yeni eğitim eklendi.",
        });
      }

      resetForm();
      fetchCourses();
    } catch (error) {
      toast({
        title: "Hata!",
        description: "İşlem başarısız.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      currency: 'TRY',
      thumbnail_url: '',
      videos: []
    });
    setIsEditing(false);
    setEditingCourse(null);
  };

  const editCourse = (course) => {
    setFormData({
      title: course.title,
      description: course.description,
      price: course.price.toString(),
      currency: course.currency,
      thumbnail_url: course.thumbnail_url || '',
      videos: course.videos || []
    });
    setEditingCourse(course);
    setIsEditing(true);
  };

  const deleteCourse = async (courseId) => {
    if (!window.confirm('Bu eğitimi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/admin/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({
        title: "Başarılı!",
        description: "Eğitim silindi.",
      });
      fetchCourses();
    } catch (error) {
      toast({
        title: "Hata!",
        description: "Silme işlemi başarısız.",
        variant: "destructive",
      });
    }
  };

  const addVideo = () => {
    setFormData({
      ...formData,
      videos: [...formData.videos, { title: '', vimeo_url: '', description: '' }]
    });
  };

  const updateVideo = (index, field, value) => {
    const updatedVideos = [...formData.videos];
    updatedVideos[index][field] = value;
    setFormData({ ...formData, videos: updatedVideos });
  };

  const removeVideo = (index) => {
    const updatedVideos = formData.videos.filter((_, i) => i !== index);
    setFormData({ ...formData, videos: updatedVideos });
  };

  if (!user || user.role !== 'admin') {
    return <Navigate to="#home" />;
  }

  return (
    <div className="min-h-screen pt-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-2">Eğitim yönetimi</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Course Form */}
          <Card>
            <CardHeader>
              <CardTitle>
                {isEditing ? 'Eğitimi Düzenle' : 'Yeni Eğitim Ekle'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Başlık</Label>
                  <Input
                    id="title"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Açıklama</Label>
                  <Textarea
                    id="description"
                    required
                    rows={4}
                    placeholder="Eğitimin detaylı açıklaması..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Fiyat</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0 = Ücretsiz"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">0 yazarsanız eğitim ücretsiz olur</p>
                  </div>
                  <div>
                    <Label htmlFor="currency">Para Birimi</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => setFormData({ ...formData, currency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TRY">TRY (Türk Lirası)</SelectItem>
                        <SelectItem value="USD">USD (Dolar)</SelectItem>
                        <SelectItem value="EUR">EUR (Euro)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
                  <Input
                    id="thumbnail_url"
                    type="url"
                    value={formData.thumbnail_url}
                    onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                  />
                </div>

                <Separator />

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Label className="text-base font-semibold">Videolar</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addVideo}>
                      Video Ekle
                    </Button>
                  </div>

                  {formData.videos.map((video, index) => (
                    <Card key={index} className="mb-4">
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <Label className="text-sm font-medium">Video {index + 1}</Label>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeVideo(index)}
                            >
                              Sil
                            </Button>
                          </div>
                          <Input
                            placeholder="Video Başlığı"
                            required
                            value={video.title}
                            onChange={(e) => updateVideo(index, 'title', e.target.value)}
                          />
                          <Input
                            placeholder="Vimeo Embed URL (örn: https://player.vimeo.com/video/123456789)"
                            required
                            value={video.vimeo_url}
                            onChange={(e) => updateVideo(index, 'vimeo_url', e.target.value)}
                          />
                          <Textarea
                            placeholder="Video açıklaması (opsiyonel)"
                            rows={2}
                            value={video.description}
                            onChange={(e) => updateVideo(index, 'description', e.target.value)}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {isEditing ? 'Güncelle' : 'Ekle'}
                  </Button>
                  {isEditing && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      İptal
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Courses List */}
          <Card>
            <CardHeader>
              <CardTitle>Mevcut Eğitimler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courses.map((course) => (
                  <Card key={course.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{course.title}</h3>
                          <p className="text-gray-600 text-sm mb-2 line-clamp-2">{course.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                            {course.price === 0 ? (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                ÜCRETSİZ
                              </Badge>
                            ) : (
                              <span className="font-medium">{course.price} {course.currency}</span>
                            )}
                            <span>{course.videos?.length || 0} video</span>
                            <span className={course.is_active ? "text-green-600" : "text-red-600"}>
                              {course.is_active ? "Aktif" : "Pasif"}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => editCourse(course)}
                          >
                            Düzenle
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteCourse(course.id)}
                          >
                            Sil
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [currentHash, setCurrentHash] = useState(window.location.hash.slice(1) || 'home');

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash.slice(1) || 'home');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const renderPage = () => {
    if (currentHash.startsWith('course/')) {
      const courseId = currentHash.split('/')[1];
      return <CourseDetailPage courseId={courseId} />;
    }
    
    switch (currentHash) {
      case 'login':
        return <LoginPage />;
      case 'register':
        return <RegisterPage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'admin':
        return <AdminPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <AuthProvider>
      <div className="App">
        <Navigation />
        {renderPage()}
        <Toaster />
      </div>
    </AuthProvider>
  );
}

export default App;