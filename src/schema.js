const { gql } = require("apollo-server");
const { prisma } = require("./db");

const typeDefs = gql`
  type User {
    email: String!
    id: ID!
    name: String
    posts: [Post!]!
  }

  type Post {
    content: String
    id: ID!
    published: Boolean!
    title: String!
    author: User
  }

  type Query {
    feed: [Post!]!
    post(id: ID!): Post
    getUser(email: String!): User
  }

  type Mutation {
    createUser(data: UserCreateInput!): User!
    createDraft(authorEmail: String, content: String, title: String!): Post!
    publish(id: ID!): Post
    associateUserWithPost(email: String!, postId: ID!): User
  }

  input UserCreateInput {
    email: String!
    name: String
    posts: [PostCreateManyWithoutAuthorInput!]
  }

  input PostCreateManyWithoutAuthorInput {
    content: String
    published: Boolean
    title: String!
  }
`;

const resolvers = {
  Query: {
    feed: (parent, args) => {
      return prisma.post.findMany({
        where: { published: true },
      });
    },
    post: (parent, args) => {
      return prisma.post.findUnique({
        where: { id: Number(args.id) },
      });
    },
    getUser: (parent, args) => {
      return prisma.user.findUnique({
        where: { email: args.email },
      });
    }
  },
  Mutation: {
    createDraft: (parent, args) => {
      return prisma.post.create({
        data: {
          title: args.title,
          content: args.content,
          published: false,
          author: args.authorEmail && {
            connect: { email: args.authorEmail },
          },
        },
      });
    },
    publish: (parent, args) => {
      return prisma.post.update({
        where: {
          id: Number(args.id),
        },
        data: {
          published: true,
        },
      });
    },
    createUser: (parent, args) => {
      return prisma.user.create({
        data: {
          email: args.data.email,
          name: args.data.name,
          posts: { create: args.data.posts },
        },
      });
    },
    associateUserWithPost: (parent, args) => {
      return prisma.user.update({
        where: { email: args.email },
        data: {
          posts: {
            connect: { id: Number(args.postId) },
          },
        },
      });
    }
  },
  User: {
    posts: (parent, args) => {
      return prisma.user
        .findUnique({
          where: { id: parent.id },
        })
        .posts();
    }
  },
  Post: {
    author: (parent, args) => {
      return prisma.post
        .findUnique({
          where: { id: parent.id },
        })
        .author();
    }
  }
};

module.exports = {
  resolvers,
  typeDefs,
};
