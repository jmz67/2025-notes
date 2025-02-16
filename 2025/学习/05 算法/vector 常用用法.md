
```cpp
#include <iostream>
#include <vector>

using namespace std;

int main() {
    // 1. 构造函数示例
    vector<int> vec1; // 默认构造，空 vector
    vector<int> vec2(5); // 指定大小，元素默认初始化为 0
    vector<int> vec3(5, 10); // 指定大小和初始值
    vector<int> vec4 = {1, 2, 3, 4, 5}; // 从初始化列表构造

    // 2. 容量相关操作
    cout << "vec4 size:" << vec4.size() << endl;
    cout 
}
```