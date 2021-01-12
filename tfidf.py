#載入函示庫
import docx
import pandas as pd
import jieba
import re
import numpy as np
jieba.set_dictionary('dict_company.txt')
jieba.load_userdict("user.txt")
from sklearn.feature_extraction.text import TfidfVectorizer
from sqlalchemy import create_engine
from numpy.linalg import norm
import django_cosmetic.data as inputs
from django.http import HttpResponse , JsonResponse , HttpRequest
#前處理-去除數字及標點符號
def clean_text(text_string):
    text_string = re.sub(r'[^\u4e00-\u9fa5a-zA-Z]+', '', text_string)
    return(text_string)

#前處理-斷詞
def preprocess(item): 
    terms = ' '.join([t for t in jieba.cut_for_search(item) if t not in vocab_dict])
    return terms

def cosine_similarity(vector1, vector2):
    score = np.dot(vector1, vector2)  / (norm(vector1) * norm(vector2))
    return score

#排序最相關的違規句子
def sklearn_retrieve(testing_tfidf,**test2):
    testing_vector = testing_tfidf
    idx_score_mapping = [(idx,cosine_similarity(testing_vector, vec)) for idx, vec in enumerate(test2['test'])]
    top3_idxs = np.array(sorted(idx_score_mapping, key=lambda x:x[1], reverse=True))[:, 0]
    return top3_idxs,idx_score_mapping

def predict(request):
    cosmetic = pd.DataFrame(advertise,columns=['original_text'])
    cosmetic['seg_text']=cosmetic['original_text'].apply(clean_text)
    cosmetic['seg_text'] =cosmetic['seg_text'].apply(preprocess)
    one_four = pd.DataFrame(appendix,columns=['original_text'])
    one_four['seg_text']=one_four['original_text'].apply(clean_text)
    one_four['seg_text'] = one_four['seg_text'].apply(preprocess)

    like_sentence1,like_percent1,like_sentence2,like_percent2,catch_n,catch_v,catch_a=[],[],[],[],[],[],[]
    res_data = {}
    
    print(len(res_data))
    res_data['success'] = False 
    if request.POST:
        ans = request.POST.get('input_text')
        seg_ans=preprocess(clean_text(ans))
        #將測試廣告做斷詞
        new=pd.DataFrame({'original_text':ans,'seg_text':seg_ans},index=[len(cosmetic)])
        new2=pd.DataFrame({'original_text':ans,'seg_text':seg_ans},index=[len(one_four)])
        cosmetic=cosmetic.append(new,ignore_index=True)
        one_four=one_four.append(new2,ignore_index=True)
        tfidf = TfidfVectorizer()
        cosmetic['tfidf'] =list(tfidf.fit_transform(cosmetic['seg_text']).toarray())
        one_four['tfidf'] =list(tfidf.fit_transform(one_four['seg_text']).toarray())
        #計算餘弦相似性
        testing_tfidf=cosmetic['tfidf'][len(cosmetic)-1]
        testing_tfidf2=one_four['tfidf'][len(one_four)-1]
        get_index,get_vallue=sklearn_retrieve(testing_tfidf,test=cosmetic['tfidf'])
        get_index2,get_vallue2=sklearn_retrieve(testing_tfidf2,test=one_four['tfidf'])

        get_list=get_index.tolist()
        get_list.remove(len(cosmetic)-1)
        get_vallue.pop()
        get_list2=get_index2.tolist()
        get_list2.remove(len(one_four)-1)
        get_vallue2.pop()
        for val in get_vallue:
            like_percent1.append(val[1])
        like_percent1.sort(reverse=True)
        for val in cosmetic['original_text'][get_list]:
            like_sentence1.append(val)
        
        for a in get_vallue2:
            like_percent2.append(a[1])
        like_percent2.sort(reverse=True)
        for b in one_four['original_text'][get_list2]:
            like_sentence2.append(b)
        res_data['like_sentence1'] = like_sentence1
        res_data['like_percent1'] = like_percent1
        res_data['like_sentence2'] = like_sentence2
        res_data['like_percent2'] = like_percent2
        cut=[t for t in jieba.cut(ans,cut_all=False) if t not in vocab_dict]
        for i in cut:
            if i in keywords:
                catch_n.append(i)
        for i in cut:
            if i in v:
                catch_v.append(i)
        for i in cut:
            if i in a:
                catch_a.append(i)
        res_data['ans'] = ans
        res_data['catch_n'] = catch_n
        res_data['catch_v'] = catch_v
        res_data['catch_a'] = catch_a
        res_data['keyword14'] = keyword14
    res_data['success'] = True
    return JsonResponse(res_data)

vocab_dict = inputs.make_dict()
advertise = inputs.input_data()
keywords = inputs.keyword()
appendix = inputs.appendix()
keyword14 = inputs.keyword14()
v = inputs.v()
a = inputs.a()