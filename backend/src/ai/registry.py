import inspect
import json
from functools import wraps
from typing import Callable, Dict, Any, List
from loguru import logger

class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, Callable] = {}
        self._schemas: List[Dict[str, Any]] = []

    def register(self, func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            return await func(*args, **kwargs)

        name = func.__name__
        description = (func.__doc__ or "").strip()
        
        sig = inspect.signature(func)
        properties = {}
        required = []

        for param_name, param in sig.parameters.items():
            if param_name == "self": continue
            
            param_type = "string"
            if param.annotation == int: param_type = "integer"
            elif param.annotation == float: param_type = "number"
            elif param.annotation == bool: param_type = "boolean"
            
            properties[param_name] = {"type": param_type}
            
            if param.default == inspect.Parameter.empty:
                required.append(param_name)

        tool_def = {
            "type": "function",
            "function": {
                "name": name,
                "description": description,
                "parameters": {
                    "type": "object",
                    "properties": properties,
                    "required": required
                }
            }
        }

        self._tools[name] = func
        self._schemas.append(tool_def)
        return wrapper

    @property
    def tools_schema(self):
        return self._schemas

    async def execute(self, tool_name: str, arguments: Dict[str, Any]):
        """Tìm và thực thi hàm dựa trên tên"""
        if tool_name not in self._tools:
            return f"Lỗi: Không tìm thấy công cụ '{tool_name}'."
        
        func = self._tools[tool_name]
        try:
            result = await func(**arguments)
            return result
        except Exception as e:
            logger.error(f"Error executing tool {tool_name}: {e}")
            return f"Lỗi hệ thống khi thực thi {tool_name}: {str(e)}"

agent_registry = ToolRegistry()