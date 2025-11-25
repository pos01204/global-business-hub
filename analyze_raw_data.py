import pandas as pd
import os

# raw_data 폴더의 엑셀 파일들 분석
files = ['artists.xlsx', 'logistics.xlsx', 'order.xlsx', 'users.xlsx']

for filename in files:
    filepath = f'raw_data/{filename}'
    if os.path.exists(filepath):
        print(f"\n{'='*80}")
        print(f"파일: {filename}")
        print(f"{'='*80}")
        try:
            # 첫 5행 읽기
            df = pd.read_excel(filepath, nrows=5)
            print(f"\n컬럼 목록 ({len(df.columns)}개):")
            for i, col in enumerate(df.columns, 1):
                print(f"  {i}. {col}")
            
            print(f"\n데이터 샘플 (첫 3행):")
            print(df.head(3).to_string())
            
            # 전체 행 수 확인
            df_full = pd.read_excel(filepath)
            print(f"\n전체 행 수: {len(df_full)}")
            
        except Exception as e:
            print(f"오류 발생: {e}")
    else:
        print(f"\n파일을 찾을 수 없습니다: {filepath}")


