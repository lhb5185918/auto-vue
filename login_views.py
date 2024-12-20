from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from rest_framework.permissions import AllowAny
import logging

# 设置日志
logger = logging.getLogger(__name__)

class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def post(self, request):
        try:
            # 详细的请求信息日志
            logger.info("==== Login Debug Info ====")
            logger.info(f"Request Method: {request.method}")
            logger.info(f"Request Headers: {request.headers}")
            logger.info(f"Request Data: {request.data}")
            
            username = request.data.get('username')
            password = request.data.get('password')
            
            if not username or not password:
                return Response({
                    "code": 400,
                    "message": "用户名和密码不能为空",
                    "data": None
                })

            # 检查用户是否存在
            try:
                user = User.objects.filter(username=username).first()
                if not user:
                    return Response({
                        "code": 401,
                        "message": "用户不存在",
                        "data": None
                    }, status=status.HTTP_401_UNAUTHORIZED)
            except Exception as e:
                logger.error(f"Error checking user: {str(e)}")
                raise

            # 认证用户
            user = authenticate(username=username, password=password)
            if user is not None:
                try:
                    # 生成token
                    refresh = RefreshToken.for_user(user)
                    access_token = str(refresh.access_token)
                    
                    # 构建响应数据
                    response_data = {
                        "code": 200,
                        "message": "登录成功",
                        "data": {
                            "token": access_token,
                            "refresh": str(refresh),
                            "user": {
                                "id": user.id,
                                "username": user.username,
                                "email": user.email,
                                "avatar": ""  # 如果有头像字段，在这里添加
                            },
                            "redirect_url": "/"
                        }
                    }
                    return Response(response_data)
                except Exception as e:
                    logger.error(f"Error generating token: {str(e)}")
                    raise
            else:
                return Response({
                    "code": 401,
                    "message": "用户名或密码错误",
                    "data": None
                }, status=status.HTTP_401_UNAUTHORIZED)
                
        except Exception as e:
            logger.error(f"Login error: {str(e)}", exc_info=True)
            return Response({
                "code": 500,
                "message": "登录失败，请稍后重试",
                "data": None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 