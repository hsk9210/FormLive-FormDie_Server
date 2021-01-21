import * as express from 'express';
import * as bcrypt from 'bcrypt'; //비밀번호 암호화모듈 사용 필요?
import * as passport from 'passport';
import * as multer from 'multer';
import * as fs from 'fs';

import { Connection, createConnection, createQueryBuilder, getRepository, QueryBuilder } from "typeorm"; //login테스트 위한 임시 커넥션 생성. 나중에 index.ts에서 받아오는 방식으로 변경하기
import { Entity, EntityRepository, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany, ManyToMany, JoinTable, Repository } from "typeorm";

import { Form } from "../entity/Form";
import { Group } from '../entity/Group';
import { Relation } from '../entity/Relation';
import { Suggestion } from '../entity/Suggestion';
import { User } from "../entity/User";
import { Userform } from '../entity/Userform';

const router = express.Router();

router.get('', async (req, res, next) => {

});

router.post('/:id', async (req, res, next) => {

});

router.post('', async (req, res, next) => {
  try {

    //Group 테이블에 제목을 등록
    const group = (await createQueryBuilder("group")
      .insert()
      .into(Group)
      .values([
        { title: req.body.title }
      ])
      .execute());

    //userId, formId, groupId를 정리해서 ORM에 넣을 수 있는 형식으로 가공
    let relationArr = [];
    for (let formId of req.body.forms) {
      relationArr.push({
        userId: req.session.passport.user,
        formId,
        groupId: group.identifiers[0].id
      })
    }

    //Relation 테이블에 그 그룹의 소유 유저와 소속됨 폼들을 등록
    await createQueryBuilder("relation")
      .insert()
      .into(Relation)
      .values(relationArr)
      .execute();    
    res.send({ data: { groupId: group.identifiers[0].id, title: req.body.title, forms: req.body.forms }, message: "new user group created" })
  } catch (error) {
    console.error(error.message);
    if (error.message === "Cannot read property 'user' of undefined") {
      res.status(401).send({ data: null, message: "not authorized" });
    } else {
      res.status(400).send({ data: null, message: error.message })
    }
    
  };
});

router.patch('', async (req, res, next) => {

});

router.delete('', async (req, res, next) => {
  try {
    //Relation 테이블에서 삭제
    const isDeleted = (await createQueryBuilder()
      .delete()
      .from(Relation)
      .where("userId = :userId", { userId: req.session.passport.user })
      .andWhere("groupId = :groupId", { groupId: req.body.groupId })
      .execute()).affected;

    //Group이 유저 생성 그룹일 경우 Group 테이블에서도 삭제
    await createQueryBuilder()
      .delete()
      .from(Group)
      .where("isDefaultGroup = :isDefaultGroup", { isDefaultGroup: 0 })
      .andWhere("id = :id", { id: req.body.groupId })
      .execute();
    if (isDeleted) {
      res.send({ data: null, message: 'form group delete complete' });
    } else {
      res.status(400).send({ data: null, message: "not deleted. maybe not exist any more?" });
    }
  } catch (err) {
    console.error(err);
    res.status(401).send({ data: null, message: "not authorized" });
  }
});

export default router;
